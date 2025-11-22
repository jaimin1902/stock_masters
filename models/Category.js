import pool from '../db/connection.js';

export class Category {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM product_categories ORDER BY name'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM product_categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create(categoryData) {
    const { name, description } = categoryData;
    const result = await pool.query(
      `INSERT INTO product_categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description || null]
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
      `UPDATE product_categories SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

