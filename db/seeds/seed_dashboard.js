import pool from '../connection.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function seedDashboard() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting dashboard seed data...');

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
      `INSERT INTO warehouses (name, code, address, is_active) VALUES
       ('Main Warehouse', 'MAIN-001', '123 Main Street, City, Country', true),
       ('Production Warehouse', 'PROD-001', '456 Production Ave, City, Country', true),
       ('Distribution Center', 'DIST-001', '789 Distribution Blvd, City, Country', true)
       RETURNING id`
    );
    const warehouseIds = warehousesResult.rows.map(r => r.id);
    const mainWarehouseId = warehouseIds[0];
    const prodWarehouseId = warehouseIds[1];
    const distWarehouseId = warehouseIds[2];

    // 3. Create Product Categories
    console.log('📁 Creating product categories...');
    const categoriesResult = await client.query(
      `INSERT INTO product_categories (name, description) VALUES
       ('Raw Materials', 'Raw materials used in production'),
       ('Finished Goods', 'Completed products ready for sale'),
       ('Components', 'Individual components and parts'),
       ('Tools & Equipment', 'Tools and equipment used in operations'),
       ('Office Supplies', 'Office supplies and stationery')
       RETURNING id`
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
       RETURNING id`
    );
    const supplierIds = suppliersResult.rows.map(r => r.id);

    // 6. Create Initial Stock
    console.log('📊 Creating initial stock...');
    const stockEntries = [
      // Main Warehouse
      [productIds[0], mainWarehouseId, 500],
      [productIds[1], mainWarehouseId, 45],
      [productIds[2], mainWarehouseId, 60],
      [productIds[3], mainWarehouseId, 150],
      [productIds[4], mainWarehouseId, 85],
      [productIds[5], mainWarehouseId, 120],
      [productIds[6], mainWarehouseId, 90],
      [productIds[7], mainWarehouseId, 35],
      [productIds[8], mainWarehouseId, 200],
      [productIds[9], mainWarehouseId, 55],
      // Production Warehouse
      [productIds[0], prodWarehouseId, 300],
      [productIds[1], prodWarehouseId, 25],
      [productIds[3], prodWarehouseId, 100],
      [productIds[4], prodWarehouseId, 50],
      // Distribution Center
      [productIds[1], distWarehouseId, 30],
      [productIds[2], distWarehouseId, 40],
      [productIds[5], distWarehouseId, 80],
      [productIds[6], distWarehouseId, 60],
    ];

    for (const [productId, warehouseId, quantity] of stockEntries) {
      await client.query(
        `INSERT INTO stock (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = $3`,
        [productId, warehouseId, quantity]
      );
    }

    // 7. Create Receipts with schedule dates
    console.log('📥 Creating receipts with schedule dates...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Receipt 1: Late (schedule_date < today)
    const receipt1Result = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_id, warehouse_id, status, schedule_date, notes) 
       VALUES ($1, $2, $3, 'pending', $4, 'Late receipt - needs attention')
       RETURNING id`,
      ['REC-001', supplierIds[0], mainWarehouseId, yesterday.toISOString().split('T')[0]]
    );
    const receipt1Id = receipt1Result.rows[0].id;
    await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
       ($1, $2, 100, 25.50),
       ($1, $3, 10, 150.00)`,
      [receipt1Id, productIds[0], productIds[1]]
    );

    // Receipt 2: Late (schedule_date < today)
    const receipt2Result = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_id, warehouse_id, status, schedule_date, notes) 
       VALUES ($1, $2, $3, 'pending', $4, 'Another late receipt')
       RETURNING id`,
      ['REC-002', supplierIds[1], mainWarehouseId, lastWeek.toISOString().split('T')[0]]
    );
    const receipt2Id = receipt2Result.rows[0].id;
    await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
       ($1, $2, 50, 12.00)`,
      [receipt2Id, productIds[3]]
    );

    // Receipt 3: Operation (schedule_date > today)
    const receipt3Result = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_id, warehouse_id, status, schedule_date, notes) 
       VALUES ($1, $2, $3, 'pending', $4, 'Scheduled for tomorrow')
       RETURNING id`,
      ['REC-003', supplierIds[2], mainWarehouseId, tomorrow.toISOString().split('T')[0]]
    );
    const receipt3Id = receipt3Result.rows[0].id;
    await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
       ($1, $2, 30, 8.50),
       ($1, $3, 20, 45.00)`,
      [receipt3Id, productIds[5], productIds[6]]
    );

    // Receipt 4: Operation (schedule_date > today)
    const receipt4Result = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_id, warehouse_id, status, schedule_date, notes) 
       VALUES ($1, $2, $3, 'pending', $4, 'Scheduled for next week')
       RETURNING id`,
      ['REC-004', supplierIds[3], prodWarehouseId, nextWeek.toISOString().split('T')[0]]
    );
    const receipt4Id = receipt4Result.rows[0].id;
    await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
       ($1, $2, 25, 15.00)`,
      [receipt4Id, productIds[4]]
    );

    // Receipt 5: Operation (schedule_date > today)
    const receipt5Result = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_id, warehouse_id, status, schedule_date, notes) 
       VALUES ($1, $2, $3, 'pending', $4, 'Future receipt')
       RETURNING id`,
      ['REC-005', supplierIds[0], distWarehouseId, nextWeek.toISOString().split('T')[0]]
    );
    const receipt5Id = receipt5Result.rows[0].id;
    await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
       ($1, $2, 40, 20.00)`,
      [receipt5Id, productIds[2]]
    );

    // Receipt 6: Operation (schedule_date > today)
    const receipt6Result = await client.query(
      `INSERT INTO receipts (receipt_number, supplier_id, warehouse_id, status, schedule_date, notes) 
       VALUES ($1, $2, $3, 'pending', $4, 'Another future receipt')
       RETURNING id`,
      ['REC-006', supplierIds[1], mainWarehouseId, tomorrow.toISOString().split('T')[0]]
    );
    const receipt6Id = receipt6Result.rows[0].id;
    await client.query(
      `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
       ($1, $2, 15, 30.00)`,
      [receipt6Id, productIds[7]]
    );

    // 8. Create Delivery Orders with schedule dates
    console.log('📤 Creating delivery orders with schedule dates...');

    // Delivery 1: Late (schedule_date < today)
    const delivery1Result = await client.query(
      `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, schedule_date, notes) 
       VALUES ($1, $2, $3, $4, 'pending', $5, 'Late delivery - urgent')
       RETURNING id`,
      ['DEL-001', mainWarehouseId, 'ABC Corp', '123 Customer St', yesterday.toISOString().split('T')[0]]
    );
    const delivery1Id = delivery1Result.rows[0].id;
    await client.query(
      `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES
       ($1, $2, 20),
       ($1, $3, 5)`,
      [delivery1Id, productIds[1], productIds[2]]
    );

    // Delivery 2: Waiting (status = waiting)
    const delivery2Result = await client.query(
      `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, schedule_date, notes) 
       VALUES ($1, $2, $3, $4, 'waiting', $5, 'Waiting for stock')
       RETURNING id`,
      ['DEL-002', mainWarehouseId, 'XYZ Ltd', '456 Business Ave', tomorrow.toISOString().split('T')[0]]
    );
    const delivery2Id = delivery2Result.rows[0].id;
    await client.query(
      `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES
       ($1, $2, 100)`,
      [delivery2Id, productIds[0]]
    );

    // Delivery 3: Waiting (status = waiting)
    const delivery3Result = await client.query(
      `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, schedule_date, notes) 
       VALUES ($1, $2, $3, $4, 'waiting', $5, 'Waiting for more stock')
       RETURNING id`,
      ['DEL-003', prodWarehouseId, 'Tech Solutions', '789 Tech Blvd', nextWeek.toISOString().split('T')[0]]
    );
    const delivery3Id = delivery3Result.rows[0].id;
    await client.query(
      `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES
       ($1, $2, 50)`,
      [delivery3Id, productIds[3]]
    );

    // Delivery 4: Operation (schedule_date > today)
    const delivery4Result = await client.query(
      `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, schedule_date, notes) 
       VALUES ($1, $2, $3, $4, 'pending', $5, 'Scheduled delivery')
       RETURNING id`,
      ['DEL-004', distWarehouseId, 'Global Inc', '321 World St', tomorrow.toISOString().split('T')[0]]
    );
    const delivery4Id = delivery4Result.rows[0].id;
    await client.query(
      `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES
       ($1, $2, 15),
       ($1, $3, 10)`,
      [delivery4Id, productIds[5], productIds[6]]
    );

    // Delivery 5: Operation (schedule_date > today)
    const delivery5Result = await client.query(
      `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, schedule_date, notes) 
       VALUES ($1, $2, $3, $4, 'pending', $5, 'Future delivery')
       RETURNING id`,
      ['DEL-005', mainWarehouseId, 'Local Business', '654 Local Rd', nextWeek.toISOString().split('T')[0]]
    );
    const delivery5Id = delivery5Result.rows[0].id;
    await client.query(
      `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES
       ($1, $2, 8)`,
      [delivery5Id, productIds[4]]
    );

    // Delivery 6: Operation (schedule_date > today)
    const delivery6Result = await client.query(
      `INSERT INTO delivery_orders (order_number, warehouse_id, customer_name, customer_address, status, schedule_date, notes) 
       VALUES ($1, $2, $3, $4, 'pending', $5, 'Another scheduled delivery')
       RETURNING id`,
      ['DEL-006', prodWarehouseId, 'Enterprise Co', '987 Enterprise Way', tomorrow.toISOString().split('T')[0]]
    );
    const delivery6Id = delivery6Result.rows[0].id;
    await client.query(
      `INSERT INTO delivery_order_items (delivery_order_id, product_id, quantity) VALUES
       ($1, $2, 12)`,
      [delivery6Id, productIds[7]]
    );

    await client.query('COMMIT');
    console.log('✅ Dashboard seed data completed successfully!');
    console.log('\n📋 Dashboard Data Summary:');
    console.log('   👤 Users: 3 (john_doe, jane_smith, warehouse_staff) - Password: password123');
    console.log('   🏭 Warehouses: 3 (Main, Production, Distribution)');
    console.log('   📦 Products: 10');
    console.log('   🏢 Suppliers: 4');
    console.log('   📥 Receipts: 6 pending (2 Late, 4 Operations)');
    console.log('   📤 Delivery Orders: 6 pending (1 Late, 2 Waiting, 3 Operations)');
    console.log('\n🎉 Dashboard should now display proper data!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDashboard().catch(console.error);

