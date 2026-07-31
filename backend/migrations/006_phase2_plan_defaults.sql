ALTER TABLE subscription_plans ADD COLUMN max_menu_items INT NULL;

ALTER TABLE subscription_plans ADD COLUMN max_categories INT NULL;

ALTER TABLE subscription_plans ADD COLUMN analytics_level VARCHAR(80) NOT NULL DEFAULT 'basic';

ALTER TABLE subscription_plans ADD COLUMN support_level VARCHAR(80) NOT NULL DEFAULT 'standard';

ALTER TABLE subscription_plans ADD COLUMN coupon_code VARCHAR(80);

ALTER TABLE subscription_plans ADD COLUMN trial_days INT NOT NULL DEFAULT 14;

ALTER TABLE subscriptions ADD COLUMN coupon_code VARCHAR(80);

ALTER TABLE invoices ADD COLUMN description TEXT;

ALTER TABLE invoices ADD COLUMN payment_method VARCHAR(80) NOT NULL DEFAULT 'manual';

UPDATE subscription_plans
SET monthly_price = 5000,
  features = '["Digital menu","QR code","Basic analytics","Up to 30 menu items"]',
  max_menu_items = 30,
  max_categories = 8,
  analytics_level = 'basic',
  support_level = 'standard',
  coupon_code = 'STARTER14',
  trial_days = 14
WHERE slug = 'starter';

UPDATE subscription_plans
SET monthly_price = 10000,
  features = '["Everything in Starter","Popular and new badges","Invoices","Advanced analytics","Up to 120 menu items"]',
  max_menu_items = 120,
  max_categories = 24,
  analytics_level = 'advanced',
  support_level = 'priority',
  coupon_code = 'PRO14',
  trial_days = 14
WHERE slug = 'professional';

UPDATE subscription_plans
SET monthly_price = NULL,
  features = '["Custom onboarding","Priority support","Multi-location management","Unlimited menu items","Custom analytics"]',
  max_menu_items = NULL,
  max_categories = NULL,
  analytics_level = 'custom',
  support_level = 'priority',
  coupon_code = 'ENTERPRISE',
  trial_days = 30
WHERE slug = 'enterprise';

UPDATE restaurants
SET plan = 'starter'
WHERE plan IS NULL OR plan = '';

INSERT INTO subscriptions (restaurant_id, plan_id, status, starts_at, ends_at, trial_ends_at, coupon_code)
SELECT r.id, p.id, CASE WHEN r.status = 'approved' THEN 'active' ELSE 'trial' END,
  CURRENT_DATE,
  DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
  DATE_ADD(CURRENT_DATE, INTERVAL p.trial_days DAY),
  p.coupon_code
FROM restaurants r
JOIN subscription_plans p ON p.slug = r.plan
WHERE NOT EXISTS (SELECT 1 FROM subscriptions existing WHERE existing.restaurant_id = r.id);

UPDATE subscriptions s
JOIN restaurants r ON r.id = s.restaurant_id
JOIN subscription_plans p ON p.id = s.plan_id
SET s.coupon_code = COALESCE(s.coupon_code, p.coupon_code),
  s.status = CASE WHEN r.status = 'approved' AND s.status = 'trial' THEN 'active' ELSE s.status END;

INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at, description, payment_method)
SELECT r.id, s.id, COALESCE(p.monthly_price, 0), CONCAT('DM-', UPPER(r.slug), '-PLAN'), 'paid',
  CASE WHEN r.status = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END,
  CONCAT(p.name, ' plan setup'),
  'manual'
FROM restaurants r
JOIN subscriptions s ON s.restaurant_id = r.id
JOIN subscription_plans p ON p.id = s.plan_id
WHERE NOT EXISTS (SELECT 1 FROM invoices existing WHERE existing.restaurant_id = r.id);
