ALTER TABLE users MODIFY role ENUM('super_admin', 'admin', 'owner', 'manager', 'customer') NOT NULL;

CREATE TABLE IF NOT EXISTS customer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(80),
  delivery_address TEXT,
  city VARCHAR(120),
  preferences JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Demo Customer', 'customer@digimenu.com', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'customer', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer@digimenu.com');

INSERT INTO customer_profiles (user_id, phone, delivery_address, city, preferences)
SELECT u.id, '+234 801 555 0200', 'Lekki Phase 1, Lagos', 'Lagos', '["rice","grills","cafe"]'
FROM users u
WHERE u.email = 'customer@digimenu.com'
  AND NOT EXISTS (SELECT 1 FROM customer_profiles existing WHERE existing.user_id = u.id);
