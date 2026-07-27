CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'owner', 'manager') NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  plan VARCHAR(80) NOT NULL DEFAULT 'starter',
  logo_url TEXT,
  cover_url TEXT,
  description TEXT,
  phone VARCHAR(80),
  whatsapp VARCHAR(80),
  email VARCHAR(190),
  address TEXT,
  google_maps_url TEXT,
  opening_hours JSON,
  social_links JSON,
  delivery_info TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  price INT NOT NULL DEFAULT 0,
  image_url TEXT,
  prep_time VARCHAR(80),
  availability VARCHAR(40) NOT NULL DEFAULT 'available',
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  is_spicy TINYINT(1) NOT NULL DEFAULT 0,
  is_vegetarian TINYINT(1) NOT NULL DEFAULT 0,
  is_vegan TINYINT(1) NOT NULL DEFAULT 0,
  is_halal TINYINT(1) NOT NULL DEFAULT 0,
  is_gluten_free TINYINT(1) NOT NULL DEFAULT 0,
  ingredients TEXT,
  calories INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES menu_categories(id)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  monthly_price INT,
  features JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  plan_id INT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'trial',
  starts_at DATE NOT NULL,
  ends_at DATE,
  trial_ends_at DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  subscription_id INT NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  status VARCHAR(40) NOT NULL DEFAULT 'paid',
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  CONSTRAINT fk_invoices_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  menu_url TEXT NOT NULL,
  image_data_url LONGTEXT,
  scans INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qr_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  menu_item_id INT,
  category_id INT,
  device_type VARCHAR(60),
  location VARCHAR(120),
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analytics_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT,
  user_id INT,
  subject VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS content_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  menu_item_id INT,
  reason TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_reports_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
