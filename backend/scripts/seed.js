require("dotenv").config();

const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const { get, initDatabase, run } = require("../data/database");

const passwordHash = bcrypt.hashSync("123456", 10);

const restaurants = [
  {
    owner: ["8am Light Kitchen", "8amlight@gmail.com"],
    name: "8am Light Kitchen",
    slug: "8am-light-kitchen",
    plan: "professional",
    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
    description: "Fresh Nigerian meals, grills, drinks, and quick lunch plates for busy teams and families.",
    phone: "+234 800 000 0000",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    delivery: "Pickup and delivery available within Lekki, Victoria Island, and Ikoyi.",
    socials: { instagram: "https://instagram.com/8amlight", x: "https://x.com/8amlight" },
    menu: baseMenu()
  },
  {
    owner: ["Lola Cafe", "lola.cafe@digimenu.test"],
    name: "Lola Cafe",
    slug: "lola-cafe",
    plan: "professional",
    logo: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80",
    description: "Cafe plates, fresh pastries, espresso drinks, and easy brunch for casual meetings.",
    phone: "+234 801 555 0101",
    address: "22 Akin Adesola Street, Victoria Island, Lagos",
    delivery: "Counter pickup, office delivery, and weekend brunch reservations available.",
    socials: { instagram: "https://instagram.com/lolacafelagos" },
    menu: {
      Breakfast: [
        ["Lola French Toast", "Brioche toast with berries, cream, and maple syrup.", 6200, "18 min", 1, 1, 0, "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=900&q=80"],
        ["Avocado Egg Toast", "Sourdough, smashed avocado, eggs, herbs, and chili oil.", 5400, "15 min", 1, 0, 1, "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80"]
      ],
      Pastries: [
        ["Butter Croissant", "Flaky croissant baked fresh with whipped butter.", 2800, "5 min", 1, 0, 0, "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80"],
        ["Banana Bread Slice", "Moist banana loaf with toasted walnuts.", 3200, "5 min", 0, 1, 0, "https://images.unsplash.com/photo-1605286978633-2dec93ff88a2?auto=format&fit=crop&w=900&q=80"]
      ],
      Lunch: [
        ["Chicken Pesto Panini", "Grilled chicken, pesto, tomato, mozzarella, and salad.", 7200, "20 min", 1, 0, 0, "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80"],
        ["Harvest Salad", "Greens, roasted vegetables, feta, grains, and citrus dressing.", 6400, "15 min", 0, 1, 0, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"]
      ],
      Drinks: [
        ["Iced Caramel Latte", "Espresso, milk, caramel, and ice.", 4200, "6 min", 1, 0, 0, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80"],
        ["Berry Hibiscus Tea", "Hibiscus tea with berries and mint.", 3500, "5 min", 0, 1, 0, "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80"]
      ]
    }
  },
  {
    owner: ["Suya Street Grill", "suya.street@digimenu.test"],
    name: "Suya Street Grill",
    slug: "suya-street-grill",
    plan: "starter",
    logo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1400&q=80",
    description: "Open-flame suya, grilled fish, sharable sides, and cold drinks.",
    phone: "+234 801 555 0102",
    address: "9 Allen Avenue, Ikeja, Lagos",
    delivery: "Evening delivery available across Ikeja, Maryland, and Ogba.",
    socials: { instagram: "https://instagram.com/suyastreetgrill" },
    menu: baseMenu("Suya Street")
  },
  {
    owner: ["Bistro Mainland", "bistro.mainland@digimenu.test"],
    name: "Bistro Mainland",
    slug: "bistro-mainland",
    plan: "professional",
    logo: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80",
    description: "Modern Nigerian bistro with rice bowls, soups, grills, and family platters.",
    phone: "+234 801 555 0103",
    address: "31 Herbert Macaulay Way, Yaba, Lagos",
    delivery: "Pickup and rider delivery available daily from 10 AM.",
    socials: { instagram: "https://instagram.com/bistromainland" },
    menu: baseMenu("Mainland")
  },
  {
    owner: ["Ocean Pearl Seafood", "ocean.pearl@digimenu.test"],
    name: "Ocean Pearl Seafood",
    slug: "ocean-pearl-seafood",
    plan: "enterprise",
    logo: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1400&q=80",
    description: "Seafood bowls, pepper soup, grilled fish, and coastal platters.",
    phone: "+234 801 555 0104",
    address: "6 Admiralty Road, Lekki Phase 1, Lagos",
    delivery: "Pre-order seafood platters for pickup, delivery, or private dining.",
    socials: { instagram: "https://instagram.com/oceanpearlseafood" },
    menu: baseMenu("Ocean Pearl")
  },
  {
    owner: ["Green Bowl Lagos", "green.bowl@digimenu.test"],
    name: "Green Bowl Lagos",
    slug: "green-bowl-lagos",
    plan: "starter",
    logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1400&q=80",
    description: "Healthy bowls, smoothies, wraps, and vegetarian-friendly daily specials.",
    phone: "+234 801 555 0105",
    address: "18 Admiralty Road, Lekki Phase 1, Lagos",
    delivery: "Office lunch packs and subscription meal bowls available on weekdays.",
    socials: { instagram: "https://instagram.com/greenbowllagos" },
    menu: baseMenu("Green Bowl")
  },
  {
    owner: ["Mama Ada Kitchen", "mama.ada@digimenu.test"],
    name: "Mama Ada Kitchen",
    slug: "mama-ada-kitchen",
    plan: "professional",
    logo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=240&q=80",
    cover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
    description: "Homestyle soups, swallow, rice dishes, and party trays for families.",
    phone: "+234 801 555 0106",
    address: "12 Toyin Street, Ikeja, Lagos",
    delivery: "Bulk lunch delivery and weekend event trays available by request.",
    socials: { instagram: "https://instagram.com/mamaadakitchen" },
    menu: baseMenu("Mama Ada")
  }
];

async function seed() {
  await initDatabase();

  await upsertUser("Super Admin", "superadmin@admin.com", passwordHash, "super_admin");
  await upsertUser("Admin", "admin@admin.com", passwordHash, "admin");
  await upsertUser("Digi Menu Manager", "manager@digimenu.com", passwordHash, "manager");
  await seedSystemSettings();
  await seedPlans();

  for (const item of restaurants) {
    const restaurant = await seedRestaurant(item);
    await seedMenu(restaurant.id, item.menu);
    await seedManagerStaff(restaurant.id);
    await seedSubscription(restaurant.id, item.slug);
    await seedQr(restaurant.id, restaurant.slug);
    await seedAnalytics(restaurant.id);
  }

  console.log("Seed complete: admin@admin.com / 123456, restaurant owners / 123456, manager@digimenu.com / 123456");
}

async function upsertUser(name, email, passwordHash, role) {
  const existing = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (existing) {
    if (existing.role !== role) await run("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [role, existing.id]);
    return;
  }
  await run("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'active')", [
    name,
    email,
    passwordHash,
    role
  ]);
}

async function seedRestaurant(item) {
  await upsertUser(item.owner[0], item.owner[1], passwordHash, "owner");
  const owner = await get("SELECT * FROM users WHERE email = ?", [item.owner[1]]);
  const openingHours = JSON.stringify({ monday: "8:00 AM - 10:00 PM", saturday: "9:00 AM - 11:00 PM", sunday: "12:00 PM - 9:00 PM" });
  let restaurant = await get("SELECT * FROM restaurants WHERE slug = ?", [item.slug]);

  if (!restaurant) {
    await run(
      `INSERT INTO restaurants (
        owner_id, name, slug, status, plan, logo_url, cover_url, description, phone, whatsapp, email,
        address, google_maps_url, opening_hours, social_links, delivery_info
      ) VALUES (?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner.id,
        item.name,
        item.slug,
        item.plan,
        item.logo,
        item.cover,
        item.description,
        item.phone,
        item.phone,
        item.owner[1],
        item.address,
        "https://maps.google.com",
        openingHours,
        JSON.stringify(item.socials),
        item.delivery
      ]
    );
  } else {
    await run(
      `UPDATE restaurants
       SET owner_id = ?, name = ?, status = 'approved', plan = ?, logo_url = ?, cover_url = ?, description = ?,
        phone = ?, whatsapp = ?, email = ?, address = ?, google_maps_url = ?, opening_hours = ?, social_links = ?,
        delivery_info = ?, updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?`,
      [
        owner.id,
        item.name,
        item.plan,
        item.logo,
        item.cover,
        item.description,
        item.phone,
        item.phone,
        item.owner[1],
        item.address,
        "https://maps.google.com",
        openingHours,
        JSON.stringify(item.socials),
        item.delivery,
        item.slug
      ]
    );
  }

  restaurant = await get("SELECT * FROM restaurants WHERE slug = ?", [item.slug]);
  return restaurant;
}

async function seedSystemSettings() {
  const existing = await get("SELECT * FROM system_settings WHERE setting_key = 'upload_provider'");
  if (existing) return;
  await run("INSERT INTO system_settings (setting_key, setting_value) VALUES ('upload_provider', 'cloudinary')");
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

async function seedMenu(restaurantId, menu) {
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

    for (const [name, description, price, prepTime, popular, isNew, spicy, imageUrl] of items) {
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
            imageUrl,
            prepTime,
            popular,
            isNew,
            spicy,
            "Fresh produce, house spice blend",
            order
          ]
        );
      } else if (existing.image_url !== imageUrl) {
        await run("UPDATE menu_items SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [imageUrl, existing.id]);
      }
      order += 1;
    }
  }
}

async function seedSubscription(restaurantId, slug) {
  const restaurant = await get("SELECT * FROM restaurants WHERE id = ?", [restaurantId]);
  const plan = await get("SELECT * FROM subscription_plans WHERE slug = ?", [restaurant.plan || "professional"]);
  let subscription = await get("SELECT * FROM subscriptions WHERE restaurant_id = ?", [restaurantId]);
  if (!subscription) {
    await run(
      "INSERT INTO subscriptions (restaurant_id, plan_id, status, starts_at, ends_at, trial_ends_at) VALUES (?, ?, 'active', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY))",
      [restaurantId, plan.id]
    );
    subscription = await get("SELECT * FROM subscriptions WHERE restaurant_id = ?", [restaurantId]);
  }

  const invoiceNumber = `DM-${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
  const invoice = await get("SELECT * FROM invoices WHERE invoice_number = ?", [invoiceNumber]);
  if (!invoice) {
    await run(
      "INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at) VALUES (?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP)",
      [restaurantId, subscription.id, plan.monthly_price || 25000, invoiceNumber]
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
  const baseUrl = String(process.env.PUBLIC_MENU_BASE_URL || "https://digi-menu-iota.vercel.app").replace(/\/$/, "");
  const menuUrl = `${baseUrl}/menu/${slug}`;
  const image = await QRCode.toDataURL(menuUrl);
  if (existing) {
    await run("UPDATE qr_codes SET menu_url = ?, image_data_url = ? WHERE restaurant_id = ?", [menuUrl, image, restaurantId]);
    return;
  }
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

function baseMenu(prefix = "") {
  const label = prefix ? `${prefix} ` : "";
  return {
    Breakfast: [
      [`${label}Sunrise Akara Plate`, "Crisp akara, pap, honey drizzle, and fruit.", 4500, "15 min", 1, 1, 0, "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80"],
      [`${label}Yam & Egg Sauce`, "Golden yam wedges with rich peppered egg sauce.", 5200, "20 min", 1, 0, 1, "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=80"]
    ],
    Rice: [
      [`${label}Smoky Party Jollof`, "Long-grain rice cooked in smoky tomato stew with plantain.", 6800, "25 min", 1, 0, 0, "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80"],
      [`${label}Native Rice Bowl`, "Palm oil rice with seafood, scent leaf, and vegetables.", 7500, "30 min", 0, 1, 1, "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80"]
    ],
    Grills: [
      [`${label}Suya Chicken Skewers`, "Spiced chicken skewers with onion, tomato, and yaji.", 8200, "25 min", 1, 0, 1, "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80"],
      [`${label}Peppered Croaker`, "Whole croaker with pepper sauce and herb potatoes.", 14500, "35 min", 0, 0, 1, "https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?auto=format&fit=crop&w=900&q=80"]
    ],
    Drinks: [
      [`${label}Zobo Citrus Cooler`, "Hibiscus, orange, ginger, and mint served chilled.", 2500, "5 min", 1, 0, 0, "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80"],
      [`${label}Chapman`, "Classic Nigerian mocktail with cucumber and citrus.", 3000, "5 min", 0, 0, 0, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80"]
    ]
  };
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seed;
