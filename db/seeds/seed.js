import dotenv from 'dotenv';
import pool from '../connection.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM move_history');
    await client.query('DELETE FROM stock_adjustments');
    await client.query('DELETE FROM transfer_items');
    await client.query('DELETE FROM internal_transfers');
    await client.query('DELETE FROM delivery_order_items');
    await client.query('DELETE FROM delivery_orders');
    await client.query('DELETE FROM receipt_items');
    await client.query('DELETE FROM receipts');
    await client.query('DELETE FROM stock');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM product_categories');
    await client.query('DELETE FROM suppliers');
    await client.query('DELETE FROM warehouses');
    await client.query("DELETE FROM users WHERE username != 'admin'");

    // 1. Create Users
    console.log('👤 Creating users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const usersResult = await client.query(
      `INSERT INTO users (username, email, password_hash, full_name, role) VALUES
       ('john_doe', 'john@stockmasters.com', $1, 'John Doe', 'stock_master'),
       ('jane_smith', 'jane@stockmasters.com', $1, 'Jane Smith', 'stock_master'),
       ('warehouse_staff', 'staff@stockmasters.com', $1, 'Warehouse Staff', 'stock_master')
       RETURNING id`,
      [passwordHash]
    );
    const userIds = usersResult.rows.map(r => r.id);
    const johnId = userIds[0];
    const janeId = userIds[1];
    const staffId = userIds[2];

    // 2. Create Warehouses
    console.log('🏭 Creating warehouses...');
    const warehousesResult = await client.query(
      `INSERT INTO warehouses (name, code, address) VALUES
       ('Main Warehouse', 'MAIN', '123 Main Street, Industrial Area, City'),
       ('Production Warehouse', 'PROD', '456 Production Road, Manufacturing Zone'),
       ('Distribution Center', 'DIST', '789 Distribution Avenue, Logistics Park')
       RETURNING id`,
    );
    const warehouseIds = warehousesResult.rows.map(r => r.id);
    const mainWarehouseId = warehouseIds[0];
    const prodWarehouseId = warehouseIds[1];
    const distWarehouseId = warehouseIds[2];

    // 3. Create Product Categories
    console.log('📦 Creating product categories...');
    const categoriesResult = await client.query(
      `INSERT INTO product_categories (name, description) VALUES
       ('Raw Materials', 'Raw materials used in production'),
       ('Finished Goods', 'Completed products ready for sale'),
       ('Components', 'Individual components and parts'),
       ('Tools & Equipment', 'Tools and equipment used in operations'),
       ('Office Supplies', 'Office supplies and stationery')
       RETURNING id`,
    );
    const categoryIds = categoriesResult.rows.map(r => r.id);
    const rawMaterialsId = categoryIds[0];
    const finishedGoodsId = categoryIds[1];
    const componentsId = categoryIds[2];
    const toolsId = categoryIds[3];
    const officeSuppliesId = categoryIds[4];

    // 4. Create Products
    console.log('📦 Creating products...');
    const productsResult = await client.query(
      `INSERT INTO products (name, sku, category_id, unit_of_measure, description, reorder_level, reorder_quantity) VALUES
       ('Steel Rods', 'STEEL-001', $1, 'kg', 'High-grade steel rods for construction', 100, 500),
       ('Wooden Desk', 'DESK-001', $2, 'unit', 'Office desk made from premium wood', 10, 50),
       ('Office Chair', 'CHAIR-001', $2, 'unit', 'Ergonomic office chair', 15, 75),
       ('Screws Pack', 'SCREW-001', $3, 'pack', 'Assorted screws pack (100 pieces)', 50, 200),
       ('Hammer', 'TOOL-001', $4, 'unit', 'Professional hammer', 20, 100),
       ('A4 Paper', 'PAPER-001', $5, 'ream', 'Premium A4 paper (500 sheets)', 30, 150),
       ('Printer Ink', 'INK-001', $5, 'cartridge', 'Printer ink cartridge', 25, 100),
       ('Table Lamp', 'LAMP-001', $2, 'unit', 'Modern table lamp', 12, 60),
       ('Cable Management', 'CABLE-001', $3, 'meter', 'Cable management system', 100, 500),
       ('Storage Box', 'BOX-001', $2, 'unit', 'Plastic storage box', 20, 100)
       RETURNING id`,
      [rawMaterialsId, finishedGoodsId, componentsId, toolsId, officeSuppliesId]
    );
    const productIds = productsResult.rows.map(r => r.id);

    // 5. Create Suppliers
    console.log('🏢 Creating suppliers...');
    const suppliersResult = await client.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
       ('Azure Interior Supplies', 'Mike Johnson', 'mike@azureinterior.com', '+1-555-0101', '100 Supplier Street'),
       ('Steel Works Inc', 'Sarah Williams', 'sarah@steelworks.com', '+1-555-0102', '200 Metal Avenue'),
       ('Office Depot Pro', 'David Brown', 'david@officedepot.com', '+1-555-0103', '300 Office Boulevard'),
       ('Tool Masters', 'Emily Davis', 'emily@toolmasters.com', '+1-555-0104', '400 Tool Road')
       RETURNING id`,
    );
    const supplierIds = suppliersResult.rows.map(r => r.id);

    // 6. Create Initial Stock
    console.log('📊 Creating initial stock...');
    const stockEntries = [
      // Main Warehouse
      [productIds[0], mainWarehouseId, 500], // Steel Rods
      [productIds[1], mainWarehouseId, 45],  // Wooden Desk
      [productIds[2], mainWarehouseId, 60],  // Office Chair
      [productIds[3], mainWarehouseId, 150], // Screws Pack
      [productIds[4], mainWarehouseId, 80],  // Hammer
      [productIds[5], mainWarehouseId, 100], // A4 Paper
      [productIds[6], mainWarehouseId, 50],  // Printer Ink
      [productIds[7], mainWarehouseId, 35],  // Table Lamp
      [productIds[8], mainWarehouseId, 200], // Cable Management
      [productIds[9], mainWarehouseId, 75],  // Storage Box
      // Production Warehouse
      [productIds[0], prodWarehouseId, 300], // Steel Rods
      [productIds[1], prodWarehouseId, 20],  // Wooden Desk
      [productIds[2], prodWarehouseId, 30], // Office Chair
      [productIds[3], prodWarehouseId, 100], // Screws Pack
      [productIds[4], prodWarehouseId, 50],  // Hammer
      // Distribution Center
      [productIds[0], distWarehouseId, 200], // Steel Rods
      [productIds[1], distWarehouseId, 15],  // Wooden Desk
      [productIds[2], distWarehouseId, 25],  // Office Chair
    ];

    for (const [productId, warehouseId, quantity] of stockEntries) {
      await client.query(
        'INSERT INTO stock (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)',
        [productId, warehouseId, quantity]
      );
    }

    // 7. Create Receipts
    console.log('📥 Creating receipts...');
    const receiptsData = [
      { number: 'REC-2024-001', warehouseId: mainWarehouseId, supplierId: supplierIds[0], status: 'validated', receivedBy: johnId, daysAgo: 5, notes: 'Initial stock receipt' },
      { number: 'REC-2024-002', warehouseId: mainWarehouseId, supplierId: supplierIds[2], status: 'validated', receivedBy: johnId, daysAgo: 3, notes: 'Office supplies delivery' },
      { number: 'REC-2024-003', warehouseId: mainWarehouseId, supplierId: supplierIds[0], status: 'pending', receivedBy: null, daysAgo: null, notes: 'Pending steel rods delivery' },
      { number: 'REC-2024-004', warehouseId: prodWarehouseId, supplierId: supplierIds[3], status: 'ready', receivedBy: johnId, daysAgo: 1, notes: 'Tools delivery ready' },
      { number: 'REC-2024-005', warehouseId: mainWarehouseId, supplierId: supplierIds[2], status: 'pending', receivedBy: null, daysAgo: null, notes: 'Scheduled for next week' },
    ];

    const receiptIds = [];
    for (const receipt of receiptsData) {
      let result;
      if (receipt.receivedBy && receipt.daysAgo !== null) {
        // Calculate the timestamp
        const receivedAt = new Date();
        receivedAt.setDate(receivedAt.getDate() - receipt.daysAgo);
        result = await client.query(
          `INSERT INTO receipts (receipt_number, warehouse_id, supplier_id, status, received_by, received_at, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [receipt.number, receipt.warehouseId, receipt.supplierId, receipt.status, receipt.receivedBy, receivedAt, receipt.notes]
        );
      } else {
        result = await client.query(
          `INSERT INTO receipts (receipt_number, warehouse_id, supplier_id, status, notes) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [receipt.number, receipt.warehouseId, receipt.supplierId, receipt.status, receipt.notes]
        );
      }
      receiptIds.push(result.rows[0].id);
    }

    // Add receipt items
    const receiptItems = [
      [receiptIds[0], productIds[0], 500, 25.50], // Steel Rods
      [receiptIds[1], productIds[1], 50, 150.00], // Wooden Desk
      [receiptIds[1], productIds[2], 60, 120.00], // Office Chair
      [receiptIds[1], productIds[5], 100, 5.50],  // A4 Paper
      [receiptIds[1], productIds[6], 50, 45.00], // Printer Ink
      [receiptIds[3], productIds[8], 200, 12.00], // Cable Management
      [receiptIds[4], productIds[3], 100, 8.50],  // Screws Pack
    ];

    for (const [receiptId, productId, quantity, unitPrice] of receiptItems) {
      await client.query(
        'INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [receiptId, productId, quantity, unitPrice]
      );
    }

    // Create move history for validated receipts
    const receiptMoveHistory = [
      [receiptIds[0], productIds[0], mainWarehouseId, 500, 0, 500, johnId, 'Initial stock receipt'],
      [receiptIds[1], productIds[1], mainWarehouseId, 50, 0, 50, johnId, 'Office supplies delivery'],
      [receiptIds[1], productIds[2], mainWarehouseId, 60, 0, 60, johnId, 'Office supplies delivery'],
    ];

    for (const [refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes] of receiptMoveHistory) {
      await client.query(
        `INSERT INTO move_history (transaction_type, reference_id, product_id, warehouse_id, quantity_change, quantity_before, quantity_after, performed_by, notes) 
         VALUES ('receipt', $1, $2, $3, $4, $5, $6, $7, $8)`,
        [refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes]
      );
    }

    // 8. Create Delivery Orders
    console.log('📤 Creating delivery orders...');
    const deliveryOrdersData = [
      { number: 'DO-2024-001', warehouseId: mainWarehouseId, customer: 'ABC Corporation', address: '123 Customer Street', status: 'validated', notes: 'Completed delivery' },
      { number: 'DO-2024-002', warehouseId: mainWarehouseId, customer: 'XYZ Industries', address: '456 Business Avenue', status: 'pending', notes: 'Waiting for stock' },
      { number: 'DO-2024-003', warehouseId: mainWarehouseId, customer: 'Tech Solutions Ltd', address: '789 Tech Road', status: 'ready', notes: 'Ready to pack' },
      { number: 'DO-2024-004', warehouseId: prodWarehouseId, customer: 'Global Trading', address: '321 Trade Street', status: 'pending', notes: 'Scheduled delivery' },
      { number: 'DO-2024-005', warehouseId: mainWarehouseId, customer: 'Local Retailer', address: '654 Retail Lane', status: 'picked', notes: 'Items picked' },
    ];

    const deliveryOrderIds = [];
    for (const order of deliveryOrdersData) {
      const result = await client.query(
        `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [order.number, order.warehouseId, order.customer, order.address, order.status, order.notes]
      );
      deliveryOrderIds.push(result.rows[0].id);
    }

    // Add delivery order items
    const deliveryOrderItems = [
      [deliveryOrderIds[0], productIds[1], 20],  // Wooden Desk
      [deliveryOrderIds[0], productIds[2], 15],  // Office Chair
      [deliveryOrderIds[1], productIds[1], 10],  // Wooden Desk (pending)
      [deliveryOrderIds[1], productIds[2], 5],   // Office Chair (pending)
      [deliveryOrderIds[2], productIds[1], 5],   // Wooden Desk
      [deliveryOrderIds[2], productIds[5], 10],  // A4 Paper
      [deliveryOrderIds[3], productIds[1], 8],   // Wooden Desk
      [deliveryOrderIds[3], productIds[2], 12],  // Office Chair
      [deliveryOrderIds[4], productIds[1], 3],   // Wooden Desk
      [deliveryOrderIds[4], productIds[1], 2],   // Wooden Desk (duplicate for testing)
    ];

    for (const [orderId, productId, quantity] of deliveryOrderItems) {
      await client.query(
        'INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES ($1, $2, $3)',
        [orderId, productId, quantity]
      );
    }

    // Create move history for validated delivery
    const deliveryMoveHistory = [
      [deliveryOrderIds[0], productIds[1], mainWarehouseId, -20, 50, 30, johnId, 'Completed delivery'],
      [deliveryOrderIds[0], productIds[2], mainWarehouseId, -15, 60, 45, johnId, 'Completed delivery'],
    ];

    for (const [refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes] of deliveryMoveHistory) {
      await client.query(
        `INSERT INTO move_history (transaction_type, reference_id, product_id, warehouse_id, quantity_change, quantity_before, quantity_after, performed_by, notes) 
         VALUES ('delivery', $1, $2, $3, $4, $5, $6, $7, $8)`,
        [refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes]
      );
    }

    // Update delivery order status
    await client.query(
      `UPDATE delivery_orders SET validated_by = $1, validated_at = CURRENT_TIMESTAMP - INTERVAL '2 days' WHERE id = $2`,
      [johnId, deliveryOrderIds[0]]
    );
    await client.query(
      `UPDATE delivery_orders SET picked_by = $1, picked_at = CURRENT_TIMESTAMP - INTERVAL '1 hour' WHERE id = $2`,
      [janeId, deliveryOrderIds[4]]
    );

    // 9. Create Internal Transfers
    console.log('🔄 Creating internal transfers...');
    const transfersData = [
      { number: 'TRF-2024-001', fromId: mainWarehouseId, toId: prodWarehouseId, status: 'validated', transferredBy: johnId, daysAgo: 4, notes: 'Transfer to production' },
      { number: 'TRF-2024-002', fromId: mainWarehouseId, toId: distWarehouseId, status: 'pending', transferredBy: null, daysAgo: null, notes: 'Pending distribution transfer' },
      { number: 'TRF-2024-003', fromId: prodWarehouseId, toId: mainWarehouseId, status: 'ready', transferredBy: null, daysAgo: null, notes: 'Return transfer ready' },
    ];

    const transferIds = [];
    for (const transfer of transfersData) {
      let result;
      if (transfer.transferredBy && transfer.daysAgo !== null) {
        // Calculate the timestamp
        const transferredAt = new Date();
        transferredAt.setDate(transferredAt.getDate() - transfer.daysAgo);
        result = await client.query(
          `INSERT INTO internal_transfers (transfer_number, from_warehouse_id, to_warehouse_id, status, transferred_by, transferred_at, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [transfer.number, transfer.fromId, transfer.toId, transfer.status, transfer.transferredBy, transferredAt, transfer.notes]
        );
      } else {
        result = await client.query(
          `INSERT INTO internal_transfers (transfer_number, from_warehouse_id, to_warehouse_id, status, notes) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [transfer.number, transfer.fromId, transfer.toId, transfer.status, transfer.notes]
        );
      }
      transferIds.push(result.rows[0].id);
    }

    // Add transfer items
    const transferItems = [
      [transferIds[0], productIds[0], 200], // Steel Rods
      [transferIds[0], productIds[1], 20],  // Wooden Desk
      [transferIds[1], productIds[0], 100], // Steel Rods (pending)
      [transferIds[1], productIds[3], 50],  // Screws Pack (pending)
      [transferIds[2], productIds[0], 50],  // Steel Rods (ready)
      [transferIds[2], productIds[1], 5],   // Wooden Desk (ready)
    ];

    for (const [transferId, productId, quantity] of transferItems) {
      await client.query(
        'INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES ($1, $2, $3)',
        [transferId, productId, quantity]
      );
    }

    // Create move history for validated transfer
    const transferMoveHistory = [
      ['transfer_out', transferIds[0], productIds[0], mainWarehouseId, -200, 500, 300, johnId, 'Transfer to production'],
      ['transfer_in', transferIds[0], productIds[0], prodWarehouseId, 200, 300, 500, johnId, 'Transfer from main warehouse'],
      ['transfer_out', transferIds[0], productIds[1], mainWarehouseId, -20, 50, 30, johnId, 'Transfer to production'],
      ['transfer_in', transferIds[0], productIds[1], prodWarehouseId, 20, 20, 40, johnId, 'Transfer from main warehouse'],
    ];

    for (const [txType, refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes] of transferMoveHistory) {
      await client.query(
        `INSERT INTO move_history (transaction_type, reference_id, product_id, warehouse_id, quantity_change, quantity_before, quantity_after, performed_by, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [txType, refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes]
      );
    }

    // 10. Create Stock Adjustments
    console.log('⚖️  Creating stock adjustments...');
    const adjustmentsData = [
      { number: 'ADJ-2024-001', productId: productIds[1], warehouseId: mainWarehouseId, recorded: 45, physical: 42, reason: 'Damaged items found during count', adjustedBy: johnId, hoursAgo: 48 },
      { number: 'ADJ-2024-002', productId: productIds[3], warehouseId: mainWarehouseId, recorded: 150, physical: 152, reason: 'Found extra items in storage', adjustedBy: johnId, hoursAgo: 24 },
      { number: 'ADJ-2024-003', productId: productIds[4], warehouseId: mainWarehouseId, recorded: 80, physical: 78, reason: 'Theft reported', adjustedBy: janeId, hoursAgo: 6 },
    ];

    const adjustmentIds = [];
    for (const adj of adjustmentsData) {
      // Calculate the timestamp
      const adjustedAt = new Date();
      adjustedAt.setHours(adjustedAt.getHours() - adj.hoursAgo);
      const result = await client.query(
        `INSERT INTO stock_adjustments (adjustment_number, product_id, warehouse_id, recorded_quantity, physical_quantity, reason, adjusted_by, adjusted_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [adj.number, adj.productId, adj.warehouseId, adj.recorded, adj.physical, adj.reason, adj.adjustedBy, adjustedAt]
      );
      adjustmentIds.push(result.rows[0].id);
    }

    // Create move history for adjustments
    const adjustmentMoveHistory = [
      [adjustmentIds[0], productIds[1], mainWarehouseId, -3, 45, 42, johnId, 'Damaged items found during count'],
      [adjustmentIds[1], productIds[3], mainWarehouseId, 2, 150, 152, johnId, 'Found extra items in storage'],
      [adjustmentIds[2], productIds[4], mainWarehouseId, -2, 80, 78, janeId, 'Theft reported'],
    ];

    for (const [refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes] of adjustmentMoveHistory) {
      await client.query(
        `INSERT INTO move_history (transaction_type, reference_id, product_id, warehouse_id, quantity_change, quantity_before, quantity_after, performed_by, notes) 
         VALUES ('adjustment', $1, $2, $3, $4, $5, $6, $7, $8)`,
        [refId, prodId, whId, qtyChange, qtyBefore, qtyAfter, userId, notes]
      );
    }

    // Update stock quantities based on adjustments
    await client.query(
      `UPDATE stock SET quantity = 42 WHERE product_id = $1 AND warehouse_id = $2`,
      [productIds[1], mainWarehouseId]
    );
    await client.query(
      `UPDATE stock SET quantity = 152 WHERE product_id = $1 AND warehouse_id = $2`,
      [productIds[3], mainWarehouseId]
    );
    await client.query(
      `UPDATE stock SET quantity = 78 WHERE product_id = $1 AND warehouse_id = $2`,
      [productIds[4], mainWarehouseId]
    );

    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Demo Data Summary:');
    console.log('   👤 Users: 3 (john_doe, jane_smith, warehouse_staff) - Password: password123');
    console.log('   🏭 Warehouses: 3 (Main, Production, Distribution)');
    console.log('   📦 Products: 10');
    console.log('   🏢 Suppliers: 4');
    console.log('   📥 Receipts: 5 (2 validated, 1 ready, 2 pending)');
    console.log('   📤 Delivery Orders: 5 (1 validated, 1 picked, 1 ready, 2 pending)');
    console.log('   🔄 Transfers: 3 (1 validated, 1 ready, 1 pending)');
    console.log('   ⚖️  Adjustments: 3');
    console.log('\n🎉 You can now login and explore the application!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);

