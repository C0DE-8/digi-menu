INSERT INTO subscription_plans (name, slug, monthly_price, features)
SELECT 'Starter', 'starter', 5000, '["Digital menu","QR code","Basic analytics"]'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'starter');

INSERT INTO subscription_plans (name, slug, monthly_price, features)
SELECT 'Professional', 'professional', 10000, '["Everything in Starter","Popular badges","Invoices","Advanced analytics"]'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'professional');

INSERT INTO subscription_plans (name, slug, monthly_price, features)
SELECT 'Enterprise', 'enterprise', NULL, '["Custom onboarding","Priority support","Multi-location management"]'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'enterprise');

INSERT INTO users (name, email, password_hash, role, status)
SELECT '8am Light Kitchen', '8amlight@gmail.com', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '8amlight@gmail.com');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Ravi Menu Manager', 'manager@ravimenu.com', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'manager', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@ravimenu.com');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Lola Cafe', 'lola.cafe@ravimenu.test', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'lola.cafe@ravimenu.test');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Suya Street Grill', 'suya.street@ravimenu.test', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'suya.street@ravimenu.test');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Bistro Mainland', 'bistro.mainland@ravimenu.test', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bistro.mainland@ravimenu.test');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Ocean Pearl Seafood', 'ocean.pearl@ravimenu.test', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ocean.pearl@ravimenu.test');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Green Bowl Lagos', 'green.bowl@ravimenu.test', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'green.bowl@ravimenu.test');

INSERT INTO users (name, email, password_hash, role, status)
SELECT 'Mama Ada Kitchen', 'mama.ada@ravimenu.test', '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e', 'owner', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mama.ada@ravimenu.test');

UPDATE users
SET password_hash = '$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e',
  status = 'active',
  role = CASE WHEN email = 'manager@ravimenu.com' THEN 'manager' ELSE 'owner' END,
  updated_at = CURRENT_TIMESTAMP
WHERE email IN (
  '8amlight@gmail.com',
  'manager@ravimenu.com',
  'lola.cafe@ravimenu.test',
  'suya.street@ravimenu.test',
  'bistro.mainland@ravimenu.test',
  'ocean.pearl@ravimenu.test',
  'green.bowl@ravimenu.test',
  'mama.ada@ravimenu.test'
);

INSERT INTO restaurants (
  owner_id, name, slug, status, plan, logo_url, cover_url, description, phone, whatsapp, email,
  address, google_maps_url, opening_hours, social_links, delivery_info
)
SELECT u.id, d.name, d.slug, 'approved', d.plan, d.logo_url, d.cover_url, d.description, d.phone, d.phone, d.email,
  d.address, 'https://maps.google.com',
  '{"monday":"8:00 AM - 10:00 PM","saturday":"9:00 AM - 11:00 PM","sunday":"12:00 PM - 9:00 PM"}',
  d.social_links, d.delivery_info
FROM (
  SELECT '8am Light Kitchen' AS name, '8am-light-kitchen' AS slug, 'professional' AS plan, '8amlight@gmail.com' AS email, '+234 800 000 0000' AS phone, '14 Admiralty Way, Lekki Phase 1, Lagos' AS address, 'Fresh Nigerian meals, grills, drinks, and quick lunch plates for busy teams and families.' AS description, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=240&q=80' AS logo_url, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80' AS cover_url, '{"instagram":"https://instagram.com/8amlight","x":"https://x.com/8amlight"}' AS social_links, 'Pickup and delivery available within Lekki, Victoria Island, and Ikoyi.' AS delivery_info
  UNION ALL SELECT 'Lola Cafe', 'lola-cafe', 'professional', 'lola.cafe@ravimenu.test', '+234 801 555 0101', '22 Akin Adesola Street, Victoria Island, Lagos', 'Cafe plates, fresh pastries, espresso drinks, and easy brunch for casual meetings.', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=240&q=80', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80', '{"instagram":"https://instagram.com/lolacafelagos"}', 'Counter pickup, office delivery, and weekend brunch reservations available.'
  UNION ALL SELECT 'Suya Street Grill', 'suya-street-grill', 'starter', 'suya.street@ravimenu.test', '+234 801 555 0102', '9 Allen Avenue, Ikeja, Lagos', 'Open-flame suya, grilled fish, sharable sides, and cold drinks.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=240&q=80', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1400&q=80', '{"instagram":"https://instagram.com/suyastreetgrill"}', 'Evening delivery available across Ikeja, Maryland, and Ogba.'
  UNION ALL SELECT 'Bistro Mainland', 'bistro-mainland', 'professional', 'bistro.mainland@ravimenu.test', '+234 801 555 0103', '31 Herbert Macaulay Way, Yaba, Lagos', 'Modern Nigerian bistro with rice bowls, soups, grills, and family platters.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=240&q=80', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80', '{"instagram":"https://instagram.com/bistromainland"}', 'Pickup and rider delivery available daily from 10 AM.'
  UNION ALL SELECT 'Ocean Pearl Seafood', 'ocean-pearl-seafood', 'enterprise', 'ocean.pearl@ravimenu.test', '+234 801 555 0104', '6 Admiralty Road, Lekki Phase 1, Lagos', 'Seafood bowls, pepper soup, grilled fish, and coastal platters.', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=240&q=80', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1400&q=80', '{"instagram":"https://instagram.com/oceanpearlseafood"}', 'Pre-order seafood platters for pickup, delivery, or private dining.'
  UNION ALL SELECT 'Green Bowl Lagos', 'green-bowl-lagos', 'starter', 'green.bowl@ravimenu.test', '+234 801 555 0105', '18 Admiralty Road, Lekki Phase 1, Lagos', 'Healthy bowls, smoothies, wraps, and vegetarian-friendly daily specials.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=240&q=80', 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1400&q=80', '{"instagram":"https://instagram.com/greenbowllagos"}', 'Office lunch packs and subscription meal bowls available on weekdays.'
  UNION ALL SELECT 'Mama Ada Kitchen', 'mama-ada-kitchen', 'professional', 'mama.ada@ravimenu.test', '+234 801 555 0106', '12 Toyin Street, Ikeja, Lagos', 'Homestyle soups, swallow, rice dishes, and party trays for families.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=240&q=80', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80', '{"instagram":"https://instagram.com/mamaadakitchen"}', 'Bulk lunch delivery and weekend event trays available by request.'
) d
JOIN users u ON u.email = d.email
WHERE NOT EXISTS (SELECT 1 FROM restaurants r WHERE r.slug = d.slug);

UPDATE restaurants r
JOIN users u ON u.email = r.email
SET r.owner_id = u.id, r.status = 'approved', r.updated_at = CURRENT_TIMESTAMP
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen');

INSERT INTO menu_categories (restaurant_id, name, slug, sort_order)
SELECT r.id, c.name, c.slug, c.sort_order
FROM restaurants r
JOIN (
  SELECT 'Breakfast' AS name, 'breakfast' AS slug, 1 AS sort_order
  UNION ALL SELECT 'Rice', 'rice', 2
  UNION ALL SELECT 'Grills', 'grills', 3
  UNION ALL SELECT 'Drinks', 'drinks', 4
) c
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen')
  AND NOT EXISTS (SELECT 1 FROM menu_categories existing WHERE existing.restaurant_id = r.id AND existing.name = c.name);

INSERT INTO menu_items (
  restaurant_id, category_id, name, description, price, image_url, prep_time,
  availability, is_popular, is_new, is_spicy, is_halal, ingredients, sort_order
)
SELECT r.id, c.id, i.name, i.description, i.price, i.image_url, i.prep_time,
  'available', i.is_popular, i.is_new, i.is_spicy, 1, 'Fresh produce, house spice blend', i.sort_order
FROM restaurants r
JOIN (
  SELECT 'Breakfast' AS category_name, 'Sunrise Akara Plate' AS name, 'Crisp akara, pap, honey drizzle, and fruit.' AS description, 4500 AS price, '15 min' AS prep_time, 1 AS is_popular, 1 AS is_new, 0 AS is_spicy, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80' AS image_url, 1 AS sort_order
  UNION ALL SELECT 'Breakfast', 'Yam & Egg Sauce', 'Golden yam wedges with rich peppered egg sauce.', 5200, '20 min', 1, 0, 1, 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=80', 2
  UNION ALL SELECT 'Rice', 'Smoky Party Jollof', 'Long-grain rice cooked in smoky tomato stew with plantain.', 6800, '25 min', 1, 0, 0, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80', 3
  UNION ALL SELECT 'Rice', 'Native Rice Bowl', 'Palm oil rice with seafood, scent leaf, and vegetables.', 7500, '30 min', 0, 1, 1, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80', 4
  UNION ALL SELECT 'Grills', 'Suya Chicken Skewers', 'Spiced chicken skewers with onion, tomato, and yaji.', 8200, '25 min', 1, 0, 1, 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80', 5
  UNION ALL SELECT 'Grills', 'Peppered Croaker', 'Whole croaker with pepper sauce and herb potatoes.', 14500, '35 min', 0, 0, 1, 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?auto=format&fit=crop&w=900&q=80', 6
  UNION ALL SELECT 'Drinks', 'Zobo Citrus Cooler', 'Hibiscus, orange, ginger, and mint served chilled.', 2500, '5 min', 1, 0, 0, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', 7
  UNION ALL SELECT 'Drinks', 'Chapman', 'Classic Nigerian mocktail with cucumber and citrus.', 3000, '5 min', 0, 0, 0, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80', 8
) i
JOIN menu_categories c ON c.restaurant_id = r.id AND c.name = i.category_name
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen')
  AND NOT EXISTS (SELECT 1 FROM menu_items existing WHERE existing.restaurant_id = r.id AND existing.name = i.name);

INSERT INTO subscriptions (restaurant_id, plan_id, status, starts_at, ends_at, trial_ends_at)
SELECT r.id, p.id, 'active', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY)
FROM restaurants r
JOIN subscription_plans p ON p.slug = r.plan
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen')
  AND NOT EXISTS (SELECT 1 FROM subscriptions existing WHERE existing.restaurant_id = r.id);

INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at)
SELECT r.id, s.id, COALESCE(p.monthly_price, 25000), CONCAT('RM-', UPPER(REPLACE(r.slug, '-', '-'))), 'paid', CURRENT_TIMESTAMP
FROM restaurants r
JOIN subscriptions s ON s.restaurant_id = r.id
JOIN subscription_plans p ON p.id = s.plan_id
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen')
  AND NOT EXISTS (SELECT 1 FROM invoices existing WHERE existing.restaurant_id = r.id);

INSERT INTO restaurant_staff (restaurant_id, user_id, role, permissions)
SELECT r.id, u.id, 'manager', '["menu:update","profile:update","qr:view","analytics:view"]'
FROM restaurants r
JOIN users u ON u.email = 'manager@ravimenu.com'
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen')
  AND NOT EXISTS (SELECT 1 FROM restaurant_staff existing WHERE existing.restaurant_id = r.id AND existing.user_id = u.id);

INSERT INTO qr_codes (restaurant_id, menu_url, scans)
SELECT r.id, CONCAT('https://ravimenu.com/menu/', r.slug), 42
FROM restaurants r
WHERE r.slug IN ('8am-light-kitchen', 'lola-cafe', 'suya-street-grill', 'bistro-mainland', 'ocean-pearl-seafood', 'green-bowl-lagos', 'mama-ada-kitchen')
  AND NOT EXISTS (SELECT 1 FROM qr_codes existing WHERE existing.restaurant_id = r.id);
