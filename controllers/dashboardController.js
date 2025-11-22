import { Stock } from '../models/Stock.js';
import { Receipt } from '../models/Receipt.js';
import { DeliveryOrder } from '../models/DeliveryOrder.js';
import { Warehouse } from '../models/Warehouse.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { TryCatch } from '../middlewares/error.js';

export const getDashboard = TryCatch(async (req, res) => {
  const { warehouse_id } = req.query;
  const warehouseId = warehouse_id ? parseInt(warehouse_id) : null;

  // Get warehouses
  const warehouses = await Warehouse.findAll({ is_active: true });

  // Get categories
  const categories = await Category.findAll();

  // Get stock summary by warehouse
  const stockByWarehouse = warehouseId
    ? await Stock.getStockByWarehouse(warehouseId)
    : [];

  // Get stock summary by category
  const stockByCategory = warehouseId
    ? await Promise.all(
        categories.map(async (cat) => {
          const stock = await Stock.getStockByCategory(cat.id, warehouseId);
          return {
            category: cat,
            items: stock,
            totalQuantity: stock.reduce((sum, item) => sum + (item.quantity || 0), 0)
          };
        })
      )
    : [];

  // Get low stock alerts
  const lowStockAlerts = await Stock.getLowStockAlerts(warehouseId);

  // Get pending receipts
  const receiptFilters = { status: 'pending' };
  if (warehouseId) receiptFilters.warehouse_id = warehouseId;
  const pendingReceipts = await Receipt.findAll(receiptFilters);

  // Get pending delivery orders
  const deliveryFilters = { status: 'pending' };
  if (warehouseId) deliveryFilters.warehouse_id = warehouseId;
  const pendingDeliveryOrders = await DeliveryOrder.findAll(deliveryFilters);

  // Calculate totals
  const totalStockValue = stockByWarehouse.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  // Get total products - if warehouse is specified, use stockByWarehouse length, otherwise get all products
  let totalProducts;
  if (warehouseId) {
    totalProducts = stockByWarehouse.length;
  } else {
    const allProducts = await Product.findAll({ is_active: true });
    totalProducts = allProducts.length;
  }
  
  const totalLowStockItems = lowStockAlerts.length;

  res.json({
    success: true,
    data: {
      summary: {
        totalStockValue,
        totalProducts,
        totalLowStockItems,
        pendingReceipts: pendingReceipts.length,
        pendingDeliveryOrders: pendingDeliveryOrders.length
      },
      warehouses,
      stockByWarehouse,
      stockByCategory,
      lowStockAlerts,
      pendingReceipts,
      pendingDeliveryOrders
    }
  });
});

