import pool from '../db/connection.js';
import { Stock } from './Stock.js';

export class DeliveryOrder {
  static async findAll(filters = {}) {
    // Check if responsible column exists, if not use NULL
    let query = `
      SELECT d.*, w.name as warehouse_name, w.code as warehouse_code,
             u.full_name as responsible_name
      FROM delivery_orders d
      JOIN warehouses w ON d.warehouse_id = w.id
      LEFT JOIN users u ON d.responsible = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.warehouse_id) {
      query += ` AND d.warehouse_id = $${paramCount++}`;
      params.push(filters.warehouse_id);
    }
    if (filters.status) {
      query += ` AND d.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const orderResult = await pool.query(
      `SELECT d.*, w.name as warehouse_name, w.code as warehouse_code,
              u.full_name as responsible_name
       FROM delivery_orders d
       JOIN warehouses w ON d.warehouse_id = w.id
       LEFT JOIN users u ON d.responsible = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT doi.*, p.name as product_name, p.sku, p.unit_of_measure,
              COALESCE(s.quantity, 0) as available_stock
       FROM delivery_order_items doi
       JOIN products p ON doi.product_id = p.id
       LEFT JOIN stock s ON s.product_id = p.id AND s.warehouse_id = $2
       WHERE doi.delivery_order_id = $1`,
      [id, order.warehouse_id]
    );

    order.items = itemsResult.rows;
    return order;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['customer_name', 'customer_address', 'schedule_date', 'responsible', 'operation_type', 'notes', 'status'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE delivery_orders SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return await this.findById(id);
  }

  static async create(orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { warehouse_id, customer_name, customer_address, schedule_date, responsible, operation_type, notes, items, user_id } = orderData;

      // Get warehouse code
      const warehouseResult = await client.query(
        'SELECT code FROM warehouses WHERE id = $1',
        [warehouse_id]
      );
      
      if (warehouseResult.rows.length === 0) {
        throw new Error('Warehouse not found');
      }
      
      const warehouseCode = warehouseResult.rows[0].code;

      // Get the next auto-increment ID for this warehouse and operation
      const lastOrderResult = await client.query(
        `SELECT order_number FROM delivery_orders 
         WHERE warehouse_id = $1 AND order_number LIKE $2
         ORDER BY id DESC LIMIT 1`,
        [warehouse_id, `${warehouseCode}/OUT/%`]
      );

      let nextId = 1;
      if (lastOrderResult.rows.length > 0) {
        const lastOrderNumber = lastOrderResult.rows[0].order_number;
        const match = lastOrderNumber.match(/\/(\d+)$/);
        if (match) {
          nextId = parseInt(match[1]) + 1;
        }
      }

      // Generate order number: WH/OUT/0001 format
      const orderNumber = `${warehouseCode}/OUT/${nextId.toString().padStart(4, '0')}`;

      const orderResult = await client.query(
        `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, schedule_date, responsible, operation_type, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
         RETURNING *`,
        [
          orderNumber, 
          warehouse_id, 
          customer_name || null, 
          customer_address || null,
          schedule_date || null,
          responsible || user_id || null,
          operation_type || null,
          notes || null
        ]
      );

      const order = orderResult.rows[0];

      // Insert items
      for (const item of items) {
        await client.query(
          `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity)
           VALUES ($1, $2, $3)`,
          [order.id, item.product_id, item.quantity]
        );
      }

      // Check stock availability and set status to 'waiting' if products are out of stock
      const orderWithItems = await this.findById(order.id);
      let hasOutOfStock = false;
      
      if (orderWithItems && orderWithItems.items && orderWithItems.items.length > 0) {
        for (const item of orderWithItems.items) {
          if ((item.available_stock || 0) < item.quantity) {
            hasOutOfStock = true;
            break;
          }
        }
        
        if (hasOutOfStock) {
          await client.query(
            `UPDATE delivery_orders SET status = 'waiting', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [order.id]
          );
        }
      }

      await client.query('COMMIT');
      return await this.findById(order.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStatus(id, status, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updates = { status };
      let timestampField = null;

      // Map new status workflow: draft, waiting, ready, done
      if (status === 'done') {
        updates.validated_by = userId;
        timestampField = 'validated_at';
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        fields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      });

      if (timestampField) {
        fields.push(`${timestampField} = CURRENT_TIMESTAMP`);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      await client.query(
        `UPDATE delivery_orders SET ${fields.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      // After status update, check stock and auto-update to waiting if needed
      const updatedOrder = await this.findById(id);
      if (updatedOrder && updatedOrder.status === 'draft' && updatedOrder.items && updatedOrder.items.length > 0) {
        let hasOutOfStock = false;
        for (const item of updatedOrder.items) {
          if ((item.available_stock || 0) < item.quantity) {
            hasOutOfStock = true;
            break;
          }
        }
        
        if (hasOutOfStock) {
          await client.query(
            `UPDATE delivery_orders SET status = 'waiting', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [id]
          );
          return await this.findById(id);
        }
      }

      await client.query('COMMIT');
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async validate(id, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const order = await this.findById(id);
      if (!order) throw new Error('Delivery order not found');
      if (order.status === 'done') throw new Error('Order already validated');

      // Check stock availability before validating
      for (const item of order.items) {
        if (item.available_stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_name}. Available: ${item.available_stock}, Required: ${item.quantity}`);
        }
      }

      // Update stock for each item (decrease)
      for (const item of order.items) {
        await Stock.updateStock(
          item.product_id,
          order.warehouse_id,
          -item.quantity,
          userId,
          'delivery',
          id,
          `Delivery Order ${order.order_number}`
        );
      }

      // Update order status to 'done'
      await this.updateStatus(id, 'done', userId);

      await client.query('COMMIT');
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

