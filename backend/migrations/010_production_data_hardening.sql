-- Forward-only correction for installations that already applied 004, 006 and 007.
-- Keep historical migrations unchanged. Do not delete business or customer data.
-- Only lock known seed identities whose password is still the exact legacy hash.
-- Accounts whose passwords were changed are intentionally preserved.
UPDATE users
SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
WHERE status = 'active'
  AND BINARY password_hash = BINARY '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e'
  AND email IN (
    '8amlight@gmail.com',
    'manager@ravimenu.com',
    'lola.cafe@ravimenu.test',
    'suya.street@ravimenu.test',
    'bistro.mainland@ravimenu.test',
    'ocean.pearl@ravimenu.test',
    'green.bowl@ravimenu.test',
    'mama.ada@ravimenu.test',
    'customer@ravimenu.com'
  );

-- Correct only setup invoices with no recorded payment date.
-- Older seed invoices with payment dates require manual reconciliation.
-- Never clear a recorded payment date or rewrite an unrelated invoice.
UPDATE invoices i
JOIN restaurants r ON r.id = i.restaurant_id
JOIN subscriptions s ON s.id = i.subscription_id AND s.restaurant_id = r.id
JOIN subscription_plans p ON p.id = s.plan_id
SET i.status = 'pending'
WHERE i.status = 'paid'
  AND i.paid_at IS NULL
  AND i.payment_method = 'manual'
  AND i.invoice_number = CONCAT('RM-', UPPER(r.slug), '-PLAN')
  AND i.description = CONCAT(p.name, ' plan setup');
