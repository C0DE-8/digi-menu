CREATE TABLE IF NOT EXISTS restaurant_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(80) NOT NULL DEFAULT 'manager',
  permissions JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_restaurant_staff_user (restaurant_id, user_id),
  CONSTRAINT fk_staff_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id)
);
