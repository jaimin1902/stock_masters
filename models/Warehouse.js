import pool from '../db/connection.js';

export class Warehouse {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM warehouses WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramCount++}`;
      params.push(filters.is_active);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM warehouses WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await pool.query(
      'SELECT * FROM warehouses WHERE code = $1',
      [code]
    );
    return result.rows[0];
  }

  static async create(warehouseData) {
    const { name, code, address } = warehouseData;
    const result = await pool.query(
      `INSERT INTO warehouses (name, code, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, code, address || null]
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
      `UPDATE warehouses SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

