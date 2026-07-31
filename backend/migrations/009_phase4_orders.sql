CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  customer_id INT NULL,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  customer_name VARCHAR(180) NOT NULL,
  customer_phone VARCHAR(80) NOT NULL,
  customer_email VARCHAR(190),
  fulfillment_type ENUM('pickup', 'delivery') NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  notes TEXT,
  status ENUM('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'pending', 'paid') NOT NULL DEFAULT 'unpaid',
  subtotal INT NOT NULL DEFAULT 0,
  delivery_fee INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  whatsapp_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NULL,
  name VARCHAR(180) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  line_total INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
