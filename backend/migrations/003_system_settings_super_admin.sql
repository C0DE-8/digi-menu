ALTER TABLE users MODIFY role ENUM('super_admin', 'admin', 'owner', 'manager') NOT NULL;

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value)
SELECT 'upload_provider', 'local'
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE setting_key = 'upload_provider'
);
