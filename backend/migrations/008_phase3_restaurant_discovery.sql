ALTER TABLE restaurants ADD COLUMN service_area VARCHAR(190);

ALTER TABLE restaurants ADD COLUMN is_open TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE restaurants ADD COLUMN estimated_delivery_minutes INT NOT NULL DEFAULT 35;

ALTER TABLE restaurants ADD COLUMN cuisine_tags JSON;

UPDATE restaurants
SET service_area = CASE
    WHEN address LIKE '%Lekki%' THEN 'Lekki'
    WHEN address LIKE '%Victoria Island%' THEN 'Victoria Island'
    WHEN address LIKE '%Ikeja%' THEN 'Ikeja'
    WHEN address LIKE '%Yaba%' THEN 'Yaba'
    ELSE 'Lagos'
  END,
  cuisine_tags = CASE
    WHEN slug = 'lola-cafe' THEN '["Cafe","Breakfast","Pastries"]'
    WHEN slug = 'ocean-pearl-seafood' THEN '["Seafood","Grills"]'
    WHEN slug = 'green-bowl-lagos' THEN '["Healthy","Salad","Smoothies"]'
    WHEN slug = 'suya-street-grill' THEN '["Grills","Suya"]'
    ELSE '["Rice","Grills","Drinks"]'
  END,
  estimated_delivery_minutes = CASE
    WHEN address LIKE '%Lekki%' THEN 25
    WHEN address LIKE '%Victoria Island%' THEN 30
    WHEN address LIKE '%Ikeja%' THEN 35
    ELSE 40
  END
WHERE service_area IS NULL OR service_area = '';
