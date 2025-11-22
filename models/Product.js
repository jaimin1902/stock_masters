import pool from '../db/connection.js';

export class Product {
  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.category_id) {
      query += ` AND p.category_id = $${paramCount++}`;
      params.push(filters.category_id);
    }
    if (filters.is_active !== undefined) {
      query += ` AND p.is_active = $${paramCount++}`;
      params.push(filters.is_active);
    }
    if (filters.search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT p.*, pc.name as category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findBySku(sku) {
    const result = await pool.query(
      'SELECT * FROM products WHERE sku = $1',
      [sku]
    );
    return result.rows[0];
  }

  static async create(productData) {
    const { name, sku, category_id, unit_of_measure, description, reorder_level, reorder_quantity } = productData;
    const result = await pool.query(
      `INSERT INTO products (name, sku, category_id, unit_of_measure, description, reorder_level, reorder_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, sku, category_id || null, unit_of_measure, description || null, reorder_level || 0, reorder_quantity || 0]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async getStockByWarehouse(productId) {
    const result = await pool.query(
      `SELECT s.*, w.name as warehouse_name, w.code as warehouse_code
       FROM stock s
       JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.product_id = $1
       ORDER BY w.name`,
      [productId]
    );
    return result.rows;
  }

  static async getStockByProductAndWarehouse(productId, warehouseId) {
    const result = await pool.query(
      'SELECT * FROM stock WHERE product_id = $1 AND warehouse_id = $2',
      [productId, warehouseId]
    );
    return result.rows[0];
  }
}

