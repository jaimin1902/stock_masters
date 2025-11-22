import pool from '../db/connection.js';

export class MoveHistory {
  static async findAll(filters = {}) {
    let query = `
      SELECT mh.*, p.name as product_name, p.sku, w.name as warehouse_name,
             u.full_name as performed_by_name,
             CASE 
               WHEN mh.transaction_type = 'receipt' THEN r.receipt_number
               WHEN mh.transaction_type = 'delivery' THEN d.order_number
               WHEN mh.transaction_type IN ('transfer_out', 'transfer_in') THEN t.transfer_number
               WHEN mh.transaction_type = 'adjustment' THEN a.adjustment_number
               ELSE NULL
             END as reference_number,
             CASE 
               WHEN mh.transaction_type = 'receipt' THEN s.name
               WHEN mh.transaction_type = 'delivery' THEN d.customer_name
               WHEN mh.transaction_type IN ('transfer_out', 'transfer_in') THEN w2.name
               ELSE NULL
             END as contact_name
      FROM move_history mh
      JOIN products p ON mh.product_id = p.id
      JOIN warehouses w ON mh.warehouse_id = w.id
      LEFT JOIN users u ON mh.performed_by = u.id
      LEFT JOIN receipts r ON mh.transaction_type = 'receipt' AND mh.reference_id = r.id
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN delivery_orders d ON mh.transaction_type = 'delivery' AND mh.reference_id = d.id
      LEFT JOIN internal_transfers t ON mh.transaction_type IN ('transfer_out', 'transfer_in') AND mh.reference_id = t.id
      LEFT JOIN warehouses w2 ON (t.from_warehouse_id = w2.id OR t.to_warehouse_id = w2.id) AND w2.id != mh.warehouse_id
      LEFT JOIN stock_adjustments a ON mh.transaction_type = 'adjustment' AND mh.reference_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.product_id) {
      query += ` AND mh.product_id = $${paramCount++}`;
      params.push(filters.product_id);
    }
    if (filters.warehouse_id) {
      query += ` AND mh.warehouse_id = $${paramCount++}`;
      params.push(filters.warehouse_id);
    }
    if (filters.transaction_type) {
      query += ` AND mh.transaction_type = $${paramCount++}`;
      params.push(filters.transaction_type);
    }
    if (filters.start_date) {
      query += ` AND mh.created_at >= $${paramCount++}`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ` AND mh.created_at <= $${paramCount++}`;
      params.push(filters.end_date);
    }

    query += ` ORDER BY mh.created_at DESC LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

