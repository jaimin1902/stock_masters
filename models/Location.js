import pool from '../db/connection.js';

export class Location {
  static async findAll(filters = {}) {
    let query = `
      SELECT l.*, w.name as warehouse_name, w.code as warehouse_code
      FROM locations l
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.warehouse_id) {
      query += ` AND l.warehouse_id = $${paramCount++}`;
      params.push(filters.warehouse_id);
    }
    if (filters.is_active !== undefined) {
      query += ` AND l.is_active = $${paramCount++}`;
      params.push(filters.is_active);
    }

    query += ' ORDER BY w.name, l.name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT l.*, w.name as warehouse_name, w.code as warehouse_code
       FROM locations l
       JOIN warehouses w ON l.warehouse_id = w.id
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByCode(code, warehouseId) {
    const result = await pool.query(
      'SELECT * FROM locations WHERE code = $1 AND warehouse_id = $2',
      [code, warehouseId]
    );
    return result.rows[0];
  }

  static async create(locationData) {
    const { name, code, warehouse_id, description } = locationData;
    const result = await pool.query(
      `INSERT INTO locations (name, code, warehouse_id, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, code, warehouse_id, description || null]
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
      `UPDATE locations SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM locations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

