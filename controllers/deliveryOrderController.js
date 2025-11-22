import { DeliveryOrder } from '../models/DeliveryOrder.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllDeliveryOrders = TryCatch(async (req, res) => {
  const { warehouse_id, status } = req.query;
  const filters = {};

  if (warehouse_id) {
    const warehouseId = parseInt(warehouse_id);
    if (!isNaN(warehouseId)) {
      filters.warehouse_id = warehouseId;
    }
  }
  if (status) filters.status = status;

  const orders = await DeliveryOrder.findAll(filters);
  res.json({ success: true, data: orders });
});

export const getDeliveryOrderById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const order = await DeliveryOrder.findById(id);

  if (!order) {
    throw new ErrorHandler(404, 'Delivery order not found');
  }

  res.json({ success: true, data: order });
});

export const createDeliveryOrder = TryCatch(async (req, res) => {
  const { warehouse_id, customer_name, customer_address, schedule_date, responsible, operation_type, notes, items } = req.body;

  if (!warehouse_id || !items || items.length === 0) {
    throw new ErrorHandler(400, 'Warehouse and items are required');
  }

  const order = await DeliveryOrder.create({
    warehouse_id,
    customer_name,
    customer_address,
    schedule_date,
    responsible: responsible || req.user.id,
    operation_type,
    notes,
    items,
    user_id: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Delivery order created successfully',
    data: order
  });
});

export const updateDeliveryOrder = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { customer_name, customer_address, schedule_date, responsible, operation_type, notes, status } = req.body;

  const updates = {};
  if (customer_name !== undefined) updates.customer_name = customer_name;
  if (customer_address !== undefined) updates.customer_address = customer_address;
  if (schedule_date !== undefined) updates.schedule_date = schedule_date;
  if (responsible !== undefined) updates.responsible = responsible;
  if (operation_type !== undefined) updates.operation_type = operation_type;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;

  const order = await DeliveryOrder.update(id, updates);

  if (!order) {
    throw new ErrorHandler(404, 'Delivery order not found');
  }

  res.json({
    success: true,
    message: 'Delivery order updated successfully',
    data: order
  });
});

export const updateDeliveryOrderStatus = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'waiting', 'ready', 'done', 'cancelled'].includes(status)) {
    throw new ErrorHandler(400, 'Invalid status');
  }

  const order = await DeliveryOrder.updateStatus(id, status, req.user.id);

  res.json({
    success: true,
    message: 'Delivery order status updated successfully',
    data: order
  });
});

export const validateDeliveryOrder = TryCatch(async (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');

  const order = await DeliveryOrder.validate(id, req.user.id);

  // Emit real-time update
  if (io) {
    io.to(`warehouse-${order.warehouse_id}`).emit('stock-updated', {
      type: 'delivery',
      order_id: order.id,
      warehouse_id: order.warehouse_id
    });
    io.emit('delivery-order-validated', { order_id: order.id });
  }

  res.json({
    success: true,
    message: 'Delivery order validated successfully. Stock updated.',
    data: order
  });
});

