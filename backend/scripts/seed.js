require("dotenv").config();

const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const { get, initDatabase, run } = require("../data/database");

async function seed() {
  await initDatabase();

  await upsertUser("Admin", "admin@admin.com", bcrypt.hashSync("123456", 10), "admin");
  await upsertUser("8am Light Kitchen", "8amlight@gmail.com", bcrypt.hashSync("123456", 10), "owner");
  await upsertUser("Digi Menu Manager", "manager@digimenu.com", bcrypt.hashSync("123456", 10), "manager");
  await seedPlans();

  const owner = await get("SELECT * FROM users WHERE email = ?", ["8amlight@gmail.com"]);
  let restaurant = await get("SELECT * FROM restaurants WHERE slug = ?", ["8am-light-kitchen"]);

  if (!restaurant) {
    await run(
      `INSERT INTO restaurants (
        owner_id, name, slug, status, plan, logo_url, cover_url, description, phone, whatsapp, email,
        address, google_maps_url, opening_hours, social_links, delivery_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner.id,
        "8am Light Kitchen",
        "8am-light-kitchen",
        "approved",
        "professional",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=240&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
        "Fresh Nigerian meals, grills, drinks, and quick lunch plates for busy teams and families.",
        "+234 800 000 0000",
        "+234 800 000 0000",
        "8amlight@gmail.com",
        "14 Admiralty Way, Lekki Phase 1, Lagos",
        "https://maps.google.com",
        JSON.stringify({ monday: "8:00 AM - 10:00 PM", saturday: "9:00 AM - 11:00 PM", sunday: "12:00 PM - 9:00 PM" }),
        JSON.stringify({ instagram: "https://instagram.com/8amlight", x: "https://x.com/8amlight" }),
        "Pickup and delivery available within Lekki, Victoria Island, and Ikoyi."
      ]
    );
    restaurant = await get("SELECT * FROM restaurants WHERE slug = ?", ["8am-light-kitchen"]);
  }

  await seedMenu(restaurant.id);
  await seedManagerStaff(restaurant.id);
  await seedSubscription(restaurant.id);
  await seedQr(restaurant.id, restaurant.slug);
  await seedAnalytics(restaurant.id);

  console.log("Seed complete: admin@admin.com / 123456, 8amlight@gmail.com / 123456, manager@digimenu.com / 123456");
}

async function upsertUser(name, email, passwordHash, role) {
  const existing = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (existing) return;
  await run("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')", [
    name,
    email,
    passwordHash,
    role
  ]);
}

async function seedPlans() {
  const plans = [
    ["Starter", "starter", 5000, ["Digital menu", "QR code", "Basic analytics"]],
    ["Professional", "professional", 10000, ["Everything in Starter", "Popular badges", "Invoices", "Advanced analytics"]],
    ["Enterprise", "enterprise", null, ["Custom onboarding", "Priority support", "Multi-location management"]]
  ];

  for (const [name, slug, price, features] of plans) {
    const existing = await get("SELECT * FROM subscription_plans WHERE slug = ?", [slug]);
    if (!existing) {
      await run("INSERT INTO subscription_plans (name, slug, monthly_price, features) VALUES (?, ?, ?, ?)", [
        name,
        slug,
        price,
        JSON.stringify(features)
      ]);
    }
  }
}

async function seedMenu(restaurantId) {
  const menu = {
    Breakfast: [
      ["Sunrise Akara Plate", "Crisp akara, pap, honey drizzle, and fruit.", 4500, "15 min", 1, 1, 0],
      ["Yam & Egg Sauce", "Golden yam wedges with rich peppered egg sauce.", 5200, "20 min", 1, 0, 1]
    ],
    Rice: [
      ["Smoky Party Jollof", "Long-grain rice cooked in smoky tomato stew with plantain.", 6800, "25 min", 1, 0, 0],
      ["Native Rice Bowl", "Palm oil rice with seafood, scent leaf, and vegetables.", 7500, "30 min", 0, 1, 1]
    ],
    Grills: [
      ["Suya Chicken Skewers", "Spiced chicken skewers with onion, tomato, and yaji.", 8200, "25 min", 1, 0, 1],
      ["Peppered Croaker", "Whole croaker with pepper sauce and herb potatoes.", 14500, "35 min", 0, 0, 1]
    ],
    Drinks: [
      ["Zobo Citrus Cooler", "Hibiscus, orange, ginger, and mint served chilled.", 2500, "5 min", 1, 0, 0],
      ["Chapman", "Classic Nigerian mocktail with cucumber and citrus.", 3000, "5 min", 0, 0, 0]
    ]
  };

  let order = 1;
  for (const [categoryName, items] of Object.entries(menu)) {
    let category = await get("SELECT * FROM menu_categories WHERE restaurant_id = ? AND name = ?", [restaurantId, categoryName]);
    if (!category) {
      await run("INSERT INTO menu_categories (restaurant_id, name, slug, sort_order) VALUES (?, ?, ?, ?)", [
        restaurantId,
        categoryName,
        slugify(categoryName),
        order
      ]);
      category = await get("SELECT * FROM menu_categories WHERE restaurant_id = ? AND name = ?", [restaurantId, categoryName]);
    }

    for (const [name, description, price, prepTime, popular, isNew, spicy] of items) {
      const existing = await get("SELECT * FROM menu_items WHERE restaurant_id = ? AND name = ?", [restaurantId, name]);
      if (!existing) {
        await run(
          `INSERT INTO menu_items (
            restaurant_id, category_id, name, description, price, image_url, prep_time,
            availability, is_popular, is_new, is_spicy, is_halal, ingredients, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, 1, ?, ?)`,
          [
            restaurantId,
            category.id,
            name,
            description,
            price,
            `https://source.unsplash.com/700x500/?restaurant,${encodeURIComponent(name)}`,
            prepTime,
            popular,
            isNew,
            spicy,
            "Fresh produce, house spice blend",
            order
          ]
        );
      }
      order += 1;
    }
  }
}

async function seedSubscription(restaurantId) {
  const plan = await get("SELECT * FROM subscription_plans WHERE slug = ?", ["professional"]);
  let subscription = await get("SELECT * FROM subscriptions WHERE restaurant_id = ?", [restaurantId]);
  if (!subscription) {
    await run(
      "INSERT INTO subscriptions (restaurant_id, plan_id, status, starts_at, ends_at, trial_ends_at) VALUES (?, ?, 'active', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY))",
      [restaurantId, plan.id]
    );
    subscription = await get("SELECT * FROM subscriptions WHERE restaurant_id = ?", [restaurantId]);
  }

  const invoice = await get("SELECT * FROM invoices WHERE invoice_number = ?", ["DM-0001"]);
  if (!invoice) {
    await run(
      "INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at) VALUES (?, ?, 10000, 'DM-0001', 'paid', CURRENT_TIMESTAMP)",
      [restaurantId, subscription.id]
    );
  }
}

async function seedManagerStaff(restaurantId) {
  const manager = await get("SELECT * FROM users WHERE email = ?", ["manager@digimenu.com"]);
  const existing = await get("SELECT * FROM restaurant_staff WHERE restaurant_id = ? AND user_id = ?", [restaurantId, manager.id]);
  if (existing) return;
  await run("INSERT INTO restaurant_staff (restaurant_id, user_id, role, permissions) VALUES (?, ?, 'manager', ?)", [
    restaurantId,
    manager.id,
    JSON.stringify(["menu:update", "profile:update", "qr:view", "analytics:view"])
  ]);
}

async function seedQr(restaurantId, slug) {
  const existing = await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurantId]);
  if (existing) return;
  const menuUrl = `http://localhost:5173/menu/${slug}`;
  const image = await QRCode.toDataURL(menuUrl);
  await run("INSERT INTO qr_codes (restaurant_id, menu_url, image_data_url, scans) VALUES (?, ?, ?, 42)", [
    restaurantId,
    menuUrl,
    image
  ]);
}

async function seedAnalytics(restaurantId) {
  const existing = await get("SELECT COUNT(*) AS count FROM analytics_events WHERE restaurant_id = ?", [restaurantId]);
  if (existing.count) return;
  const events = [
    ["menu_view", null, null, "mobile", "Lagos"],
    ["menu_view", null, null, "desktop", "Abuja"],
    ["qr_scan", null, null, "mobile", "Lagos"],
    ["item_view", 1, 1, "mobile", "Lagos"],
    ["item_view", 3, 2, "mobile", "Lagos"],
    ["whatsapp_click", null, null, "mobile", "Ibadan"]
  ];
  for (const event of events) {
    await run(
      "INSERT INTO analytics_events (restaurant_id, event_type, menu_item_id, category_id, device_type, location, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [restaurantId, ...event, JSON.stringify({ seeded: true })]
    );
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seed;
