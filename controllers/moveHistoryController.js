import { MoveHistory } from '../models/MoveHistory.js';
import { TryCatch } from '../middlewares/error.js';

export const getMoveHistory = TryCatch(async (req, res) => {
  const { product_id, warehouse_id, transaction_type, start_date, end_date, limit } = req.query;
  const filters = {};

  if (product_id) filters.product_id = parseInt(product_id);
  if (warehouse_id) filters.warehouse_id = parseInt(warehouse_id);
  if (transaction_type) filters.transaction_type = transaction_type;
  if (start_date) filters.start_date = start_date;
  if (end_date) filters.end_date = end_date;
  if (limit) filters.limit = parseInt(limit);

  const history = await MoveHistory.findAll(filters);
  res.json({ success: true, data: history });
});

