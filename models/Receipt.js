import pool from '../db/connection.js';
import { Stock } from './Stock.js';

export class Receipt {
  static async findAll(filters = {}) {
    let query = `
      SELECT r.*, s.name as supplier_name, w.name as warehouse_name,
             u.full_name as received_by_name
      FROM receipts r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      JOIN warehouses w ON r.warehouse_id = w.id
      LEFT JOIN users u ON r.received_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.warehouse_id) {
      query += ` AND r.warehouse_id = $${paramCount++}`;
      params.push(filters.warehouse_id);
    }
    if (filters.status) {
      query += ` AND r.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const receiptResult = await pool.query(
      `SELECT r.*, s.name as supplier_name, w.name as warehouse_name,
              u.full_name as received_by_name
       FROM receipts r
       LEFT JOIN suppliers s ON r.supplier_id = s.id
       JOIN warehouses w ON r.warehouse_id = w.id
       LEFT JOIN users u ON r.received_by = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (receiptResult.rows.length === 0) return null;

    const receipt = receiptResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT ri.*, p.name as product_name, p.sku, p.unit_of_measure
       FROM receipt_items ri
       JOIN products p ON ri.product_id = p.id
       WHERE ri.receipt_id = $1`,
      [id]
    );

    receipt.items = itemsResult.rows;
    return receipt;
  }

  static async create(receiptData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { warehouse_id, supplier_id, notes, items, user_id, schedule_date } = receiptData;

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
      const lastReceiptResult = await client.query(
        `SELECT receipt_number FROM receipts 
         WHERE warehouse_id = $1 AND receipt_number LIKE $2
         ORDER BY id DESC LIMIT 1`,
        [warehouse_id, `${warehouseCode}/IN/%`]
      );

      let nextId = 1;
      if (lastReceiptResult.rows.length > 0) {
        const lastReceiptNumber = lastReceiptResult.rows[0].receipt_number;
        const match = lastReceiptNumber.match(/\/(\d+)$/);
        if (match) {
          nextId = parseInt(match[1]) + 1;
        }
      }

      // Generate receipt number: WH/IN/001 format
      const receiptNumber = `${warehouseCode}/IN/${nextId.toString().padStart(3, '0')}`;

      const receiptResult = await client.query(
        `INSERT INTO receipts (receipt_number, warehouse_id, supplier_id, notes, schedule_date, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')
         RETURNING *`,
        [receiptNumber, warehouse_id, supplier_id || null, notes || null, schedule_date || null]
      );

      const receipt = receiptResult.rows[0];

      // Insert items
      for (const item of items) {
        await client.query(
          `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [receipt.id, item.product_id, item.quantity, item.unit_price || null]
        );
      }

      await client.query('COMMIT');
      return await this.findById(receipt.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['supplier_id', 'notes', 'schedule_date', 'status', 'received_by'];
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
      `UPDATE receipts SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return await this.findById(id);
  }

  static async updateStatus(id, status, userId = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updates = { status };
      if (status === 'done' && userId) {
        updates.received_by = userId;
        updates.received_at = new Date();
      }

      const result = await client.query(
        `UPDATE receipts SET status = $1, updated_at = CURRENT_TIMESTAMP${userId && status === 'done' ? ', received_by = $2, received_at = CURRENT_TIMESTAMP' : ''}
         WHERE id = ${userId && status === 'done' ? '$3' : '$2'}
         RETURNING *`,
        userId && status === 'done' ? [status, userId, id] : [status, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Receipt not found');
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

      const receipt = await this.findById(id);
      if (!receipt) throw new Error('Receipt not found');
      if (receipt.status === 'validated' || receipt.status === 'done') {
        throw new Error('Receipt already validated');
      }

      // Update stock for each item
      for (const item of receipt.items) {
        await Stock.updateStock(
          item.product_id,
          receipt.warehouse_id,
          item.quantity,
          userId,
          'receipt',
          id,
          `Receipt ${receipt.receipt_number}`
        );
      }

      // Update receipt status to 'done'
      await client.query(
        `UPDATE receipts SET status = 'done', received_by = $1, received_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [userId, id]
      );

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

