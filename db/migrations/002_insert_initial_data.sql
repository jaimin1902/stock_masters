-- Insert default warehouse
INSERT INTO warehouses (name, code, address) 
VALUES ('Main Warehouse', 'MAIN-001', '123 Main Street, City, Country')
ON CONFLICT DO NOTHING;

-- Insert default product categories
INSERT INTO product_categories (name, description) VALUES
('Raw Materials', 'Raw materials used in production'),
('Finished Goods', 'Completed products ready for sale'),
('Components', 'Individual components and parts'),
('Tools & Equipment', 'Tools and equipment used in operations')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123 - should be changed in production)
-- Password hash for 'admin123' using bcrypt (rounds: 10)
-- To generate a new hash, use: bcrypt.hashSync('admin123', 10)
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@stockmasters.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'stock_master')
ON CONFLICT DO NOTHING;

