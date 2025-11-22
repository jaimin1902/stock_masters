import pool from '../db/connection.js';
import { Stock } from './Stock.js';

export class Transfer {
  static async findAll(filters = {}) {
    let query = `
      SELECT t.*, 
             w1.name as from_warehouse_name, w1.code as from_warehouse_code,
             w2.name as to_warehouse_name, w2.code as to_warehouse_code,
             u.full_name as transferred_by_name
      FROM internal_transfers t
      JOIN warehouses w1 ON t.from_warehouse_id = w1.id
      JOIN warehouses w2 ON t.to_warehouse_id = w2.id
      LEFT JOIN users u ON t.transferred_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.from_warehouse_id) {
      query += ` AND t.from_warehouse_id = $${paramCount++}`;
      params.push(filters.from_warehouse_id);
    }
    if (filters.to_warehouse_id) {
      query += ` AND t.to_warehouse_id = $${paramCount++}`;
      params.push(filters.to_warehouse_id);
    }
    if (filters.status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const transferResult = await pool.query(
      `SELECT t.*, 
              w1.name as from_warehouse_name, w1.code as from_warehouse_code,
              w2.name as to_warehouse_name, w2.code as to_warehouse_code,
              u.full_name as transferred_by_name
       FROM internal_transfers t
       JOIN warehouses w1 ON t.from_warehouse_id = w1.id
       JOIN warehouses w2 ON t.to_warehouse_id = w2.id
       LEFT JOIN users u ON t.transferred_by = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (transferResult.rows.length === 0) return null;

    const transfer = transferResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT ti.*, p.name as product_name, p.sku, p.unit_of_measure
       FROM transfer_items ti
       JOIN products p ON ti.product_id = p.id
       WHERE ti.transfer_id = $1`,
      [id]
    );

    transfer.items = itemsResult.rows;
    return transfer;
  }

  static async create(transferData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { from_warehouse_id, to_warehouse_id, notes, items } = transferData;

      if (from_warehouse_id === to_warehouse_id) {
        throw new Error('From and to warehouses cannot be the same');
      }

      // Generate transfer number
      const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const transferResult = await client.query(
        `INSERT INTO internal_transfers (transfer_number, from_warehouse_id, to_warehouse_id, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [transferNumber, from_warehouse_id, to_warehouse_id, notes || null]
      );

      const transfer = transferResult.rows[0];

      // Insert items
      for (const item of items) {
        await client.query(
          `INSERT INTO transfer_items (transfer_id, product_id, quantity)
           VALUES ($1, $2, $3)`,
          [transfer.id, item.product_id, item.quantity]
        );
      }

      await client.query('COMMIT');
      return await this.findById(transfer.id);
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

      const transfer = await this.findById(id);
      if (!transfer) throw new Error('Transfer not found');
      if (transfer.status === 'validated') throw new Error('Transfer already validated');

      // Update stock for each item
      for (const item of transfer.items) {
        // Decrease from source warehouse
        await Stock.updateStock(
          item.product_id,
          transfer.from_warehouse_id,
          -item.quantity,
          userId,
          'transfer_out',
          id,
          `Transfer ${transfer.transfer_number} - Out`
        );

        // Increase in destination warehouse
        await Stock.updateStock(
          item.product_id,
          transfer.to_warehouse_id,
          item.quantity,
          userId,
          'transfer_in',
          id,
          `Transfer ${transfer.transfer_number} - In`
        );
      }

      // Update transfer status
      await client.query(
        `UPDATE internal_transfers SET status = 'validated', transferred_by = $1, transferred_at = CURRENT_TIMESTAMP
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

