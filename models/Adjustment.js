import pool from '../db/connection.js';
import { Stock } from './Stock.js';

export class Adjustment {
  static async findAll(filters = {}) {
    let query = `
      SELECT a.*, p.name as product_name, p.sku, w.name as warehouse_name,
             u.full_name as adjusted_by_name
      FROM stock_adjustments a
      JOIN products p ON a.product_id = p.id
      JOIN warehouses w ON a.warehouse_id = w.id
      LEFT JOIN users u ON a.adjusted_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.warehouse_id) {
      query += ` AND a.warehouse_id = $${paramCount++}`;
      params.push(filters.warehouse_id);
    }
    if (filters.product_id) {
      query += ` AND a.product_id = $${paramCount++}`;
      params.push(filters.product_id);
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, p.name as product_name, p.sku, w.name as warehouse_name,
              u.full_name as adjusted_by_name
       FROM stock_adjustments a
       JOIN products p ON a.product_id = p.id
       JOIN warehouses w ON a.warehouse_id = w.id
       LEFT JOIN users u ON a.adjusted_by = u.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(adjustmentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { product_id, warehouse_id, physical_quantity, reason, user_id } = adjustmentData;

      // Get current stock
      const stockResult = await pool.query(
        'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2',
        [product_id, warehouse_id]
      );

      const recordedQuantity = stockResult.rows[0]?.quantity || 0;
      const adjustmentQuantity = physical_quantity - recordedQuantity;

      // Generate adjustment number
      const adjustmentNumber = `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const adjustmentResult = await pool.query(
        `INSERT INTO stock_adjustments (adjustment_number, product_id, warehouse_id, recorded_quantity, physical_quantity, reason, adjusted_by, adjusted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING *`,
        [adjustmentNumber, product_id, warehouse_id, recordedQuantity, physical_quantity, reason || null, user_id]
      );

      const adjustment = adjustmentResult.rows[0];

      // Update stock
      await Stock.updateStock(
        product_id,
        warehouse_id,
        adjustmentQuantity,
        user_id,
        'adjustment',
        adjustment.id,
        reason || `Stock adjustment ${adjustmentNumber}`
      );

      await client.query('COMMIT');
      return await this.findById(adjustment.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

