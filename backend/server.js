require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { all, get, initDatabase, run } = require("./data/database");
const seed = require("./scripts/seed");

const app = express();
const port = Number(process.env.PORT || 5050);
const jwtSecret = process.env.JWT_SECRET || "digi-menu-dev-secret";

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({ ok: true, service: "digi-menu-api" });
});

app.get("/health", async (req, res) => {
  try {
    await initDatabase();
    res.json({ ok: true, app: "Digi Menu", database: "ready" });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const restaurant = await get("SELECT * FROM restaurants WHERE owner_id = ?", [user.id]);
  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
  return res.json({ token, user: publicUser(user), restaurant });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const restaurant = await get("SELECT * FROM restaurants WHERE owner_id = ?", [req.user.id]);
  res.json({ user: publicUser(req.user), restaurant });
});

app.get("/api/dashboard", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  const [categories, items, qrCode, subscription, invoices, analytics] = await Promise.all([
    all("SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order", [restaurant.id]),
    all("SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort_order", [restaurant.id]),
    get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]),
    get(
      `SELECT s.*, p.name AS plan_name, p.monthly_price, p.features
       FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
       WHERE s.restaurant_id = ?`,
      [restaurant.id]
    ),
    all("SELECT * FROM invoices WHERE restaurant_id = ? ORDER BY issued_at DESC", [restaurant.id]),
    getAnalyticsSummary(restaurant.id)
  ]);

  res.json({ restaurant, categories, items, qrCode, subscription, invoices, analytics });
});

app.put("/api/restaurant", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  const fields = ["name", "description", "phone", "whatsapp", "email", "address", "google_maps_url", "delivery_info", "logo_url", "cover_url"];
  const values = fields.map((field) => req.body[field] ?? restaurant[field] ?? "");
  await run(`UPDATE restaurants SET ${fields.map((field) => `${field} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
    ...values,
    restaurant.id
  ]);
  res.json(await get("SELECT * FROM restaurants WHERE id = ?", [restaurant.id]));
});

app.post("/api/categories", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const { name, description } = req.body;
  const sort = await get("SELECT COUNT(*) AS count FROM menu_categories WHERE restaurant_id = ?", [restaurant.id]);
  const id = await run("INSERT INTO menu_categories (restaurant_id, name, slug, description, sort_order) VALUES (?, ?, ?, ?, ?)", [
    restaurant.id,
    name,
    slugify(name),
    description || "",
    sort.count + 1
  ]);
  res.status(201).json(await get("SELECT * FROM menu_categories WHERE id = ?", [id]));
});

app.post("/api/items", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const item = req.body;
  const id = await run(
    `INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price, image_url, prep_time, availability,
      is_popular, is_new, is_spicy, is_vegetarian, is_vegan, is_halal, is_gluten_free, ingredients, calories, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurant.id,
      item.category_id,
      item.name,
      item.description || "",
      Number(item.price || 0),
      item.image_url || "",
      item.prep_time || "",
      item.availability || "available",
      Number(Boolean(item.is_popular)),
      Number(Boolean(item.is_new)),
      Number(Boolean(item.is_spicy)),
      Number(Boolean(item.is_vegetarian)),
      Number(Boolean(item.is_vegan)),
      Number(Boolean(item.is_halal)),
      Number(Boolean(item.is_gluten_free)),
      item.ingredients || "",
      item.calories || null,
      item.sort_order || 0
    ]
  );
  res.status(201).json(await get("SELECT * FROM menu_items WHERE id = ?", [id]));
});

app.get("/api/public/menu/:slug", async (req, res) => {
  const restaurant = await get("SELECT * FROM restaurants WHERE slug = ? AND status = 'approved'", [req.params.slug]);
  if (!restaurant) return res.status(404).json({ error: "Menu not found" });
  await run("INSERT INTO analytics_events (restaurant_id, event_type, device_type, metadata) VALUES (?, 'menu_view', ?, ?)", [
    restaurant.id,
    deviceFromAgent(req.headers["user-agent"]),
    JSON.stringify({ source: "public_menu" })
  ]);
  const categories = await all("SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order", [restaurant.id]);
  const items = await all("SELECT * FROM menu_items WHERE restaurant_id = ? AND availability != 'hidden' ORDER BY sort_order", [restaurant.id]);
  const qrCode = await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]);
  res.json({ restaurant, categories, items, qrCode });
});

app.post("/api/public/menu/:slug/events", async (req, res) => {
  const restaurant = await get("SELECT * FROM restaurants WHERE slug = ?", [req.params.slug]);
  if (!restaurant) return res.status(404).json({ error: "Menu not found" });
  const { event_type, menu_item_id, category_id } = req.body;
  await run(
    "INSERT INTO analytics_events (restaurant_id, event_type, menu_item_id, category_id, device_type, metadata) VALUES (?, ?, ?, ?, ?, ?)",
    [restaurant.id, event_type || "interaction", menu_item_id || null, category_id || null, deviceFromAgent(req.headers["user-agent"]), JSON.stringify({ source: "public_menu" })]
  );
  if (event_type === "qr_scan") await run("UPDATE qr_codes SET scans = scans + 1 WHERE restaurant_id = ?", [restaurant.id]);
  res.json({ ok: true });
});

app.get("/api/admin/overview", requireAuth, requireAdmin, async (req, res) => {
  const restaurants = await all("SELECT * FROM restaurants ORDER BY created_at DESC");
  const users = await all("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
  const tickets = await all("SELECT * FROM support_tickets ORDER BY created_at DESC");
  const reports = await all("SELECT * FROM content_reports ORDER BY created_at DESC");
  const revenue = await get("SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'paid'");
  res.json({
    stats: {
      restaurants: restaurants.length,
      activeRestaurants: restaurants.filter((item) => item.status === "approved").length,
      expiredSubscriptions: 0,
      revenue: revenue.total
    },
    restaurants,
    users,
    tickets,
    reports
  });
});

app.patch("/api/admin/restaurants/:id/status", requireAuth, requireAdmin, async (req, res) => {
  await run("UPDATE restaurants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.body.status, req.params.id]);
  res.json(await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]));
});

app.post("/api/qr/regenerate", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const menuUrl = `${process.env.PUBLIC_MENU_BASE_URL || "http://localhost:5173"}/menu/${restaurant.slug}`;
  const image = await QRCode.toDataURL(menuUrl);
  const existing = await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]);
  if (existing) await run("UPDATE qr_codes SET menu_url = ?, image_data_url = ? WHERE restaurant_id = ?", [menuUrl, image, restaurant.id]);
  else await run("INSERT INTO qr_codes (restaurant_id, menu_url, image_data_url) VALUES (?, ?, ?)", [restaurant.id, menuUrl, image]);
  res.json(await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]));
});

async function getAnalyticsSummary(restaurantId) {
  const rows = await all("SELECT event_type, COUNT(*) AS count FROM analytics_events WHERE restaurant_id = ? GROUP BY event_type", [restaurantId]);
  const popularItems = await all(
    `SELECT mi.name, COUNT(ae.id) AS views
     FROM analytics_events ae JOIN menu_items mi ON mi.id = ae.menu_item_id
     WHERE ae.restaurant_id = ? AND ae.event_type = 'item_view'
     GROUP BY mi.id, mi.name ORDER BY views DESC LIMIT 5`,
    [restaurantId]
  );
  return { todayVisitors: 28, weeklyVisitors: 184, monthlyVisitors: 742, eventCounts: rows, popularItems, qrScans: rows.find((row) => row.event_type === "qr_scan")?.count || 0 };
}

async function getRestaurantForUser(user) {
  if (user.role === "admin") return get("SELECT * FROM restaurants ORDER BY created_at LIMIT 1");
  return get("SELECT * FROM restaurants WHERE owner_id = ?", [user.id]);
}

async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing auth token" });
    const payload = jwt.verify(token, jwtSecret);
    const user = await get("SELECT * FROM users WHERE id = ?", [payload.id]);
    if (!user) return res.status(401).json({ error: "Invalid auth token" });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  return next();
}

function publicUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function deviceFromAgent(agent = "") {
  return /mobile|android|iphone/i.test(agent) ? "mobile" : "desktop";
}

async function start() {
  await initDatabase();
  await seed();
  const server = app.listen(port, () => {
    console.log(`Digi Menu API listening on http://localhost:${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Set PORT to another value.`);
      process.exit(1);
    }
    throw error;
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
