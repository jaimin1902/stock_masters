import pool from '../db/connection.js';

export class Stock {
  static async updateStock(productId, warehouseId, quantityChange, userId, transactionType, referenceId, notes = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current stock
      let stockResult = await client.query(
        'SELECT * FROM stock WHERE product_id = $1 AND warehouse_id = $2',
        [productId, warehouseId]
      );

      let stock = stockResult.rows[0];
      const quantityBefore = stock ? stock.quantity : 0;

      // Create stock entry if it doesn't exist
      if (!stock) {
        await client.query(
          'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)',
          [productId, warehouseId, 0]
        );
        stock = { quantity: 0 };
      }

      const quantityAfter = quantityBefore + quantityChange;

      // Update stock
      await client.query(
        'UPDATE stock SET quantity = $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3',
        [quantityAfter, productId, warehouseId]
      );

      // Log to move history
      await client.query(
        `INSERT INTO move_history (transaction_type, reference_id, product_id, warehouse_id, quantity_change, quantity_before, quantity_after, performed_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [transactionType, referenceId, productId, warehouseId, quantityChange, quantityBefore, quantityAfter, userId, notes]
      );

      await client.query('COMMIT');

      return {
        productId,
        warehouseId,
        quantityBefore,
        quantityAfter,
        quantityChange
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getStockByWarehouse(warehouseId) {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name, p.sku, p.unit_of_measure, pc.name as category_name
       FROM stock s
       JOIN products p ON s.product_id = p.id
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE s.warehouse_id = $1
       ORDER BY p.name`,
      [warehouseId]
    );
    return result.rows;
  }

  static async getStockByCategory(categoryId, warehouseId = null) {
    let query = `
      SELECT s.*, p.name as product_name, p.sku, p.unit_of_measure, w.name as warehouse_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN warehouses w ON s.warehouse_id = w.id
      WHERE p.category_id = $1
    `;
    const params = [categoryId];

    if (warehouseId) {
      query += ' AND s.warehouse_id = $2';
      params.push(warehouseId);
    }

    query += ' ORDER BY p.name, w.name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getLowStockAlerts(warehouseId = null) {
    let query = `
      SELECT s.*, p.name as product_name, p.sku, p.reorder_level, w.name as warehouse_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN warehouses w ON s.warehouse_id = w.id
      WHERE s.quantity <= p.reorder_level AND p.reorder_level > 0
    `;
    const params = [];

    if (warehouseId) {
      query += ' AND s.warehouse_id = $1';
      params.push(warehouseId);
    }

    query += ' ORDER BY (s.quantity - p.reorder_level), p.name';

    const result = await pool.query(query, params);
    return result.rows;
  }
}

