import { Supplier } from '../models/Supplier.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllSuppliers = TryCatch(async (req, res) => {
  const { is_active } = req.query;
  const filters = {};

  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const suppliers = await Supplier.findAll(filters);
  res.json({ success: true, data: suppliers });
});

export const getSupplierById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const supplier = await Supplier.findById(id);

  if (!supplier) {
    throw new ErrorHandler(404, 'Supplier not found');
  }

  res.json({ success: true, data: supplier });
});

export const createSupplier = TryCatch(async (req, res) => {
  const { name, contact_person, email, phone, address } = req.body;

  if (!name) {
    throw new ErrorHandler(400, 'Supplier name is required');
  }

  const supplier = await Supplier.create({
    name,
    contact_person,
    email,
    phone,
    address
  });

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: supplier
  });
});

export const updateSupplier = TryCatch(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new ErrorHandler(404, 'Supplier not found');
  }

  const updatedSupplier = await Supplier.update(id, updates);
  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: updatedSupplier
  });
});

