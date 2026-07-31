const express = require("express");
const { all, get, run } = require("../data/database");
const { deviceFromAgent } = require("../services/restaurants");

const router = express.Router();

router.get("/restaurants", async (req, res) => {
  const search = String(req.query.search || "").trim();
  const area = String(req.query.area || "").trim();
  const cuisine = String(req.query.cuisine || "").trim();
  const params = [];
  let where = "WHERE r.status = 'approved'";

  if (search) {
    where += ` AND (
      r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ? OR
      EXISTS (
        SELECT 1 FROM menu_items mi
        WHERE mi.restaurant_id = r.id
          AND mi.availability != 'hidden'
          AND (mi.name LIKE ? OR mi.description LIKE ?)
      )
    )`;
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  if (area) {
    where += " AND (r.service_area LIKE ? OR r.address LIKE ?)";
    const areaTerm = `%${area}%`;
    params.push(areaTerm, areaTerm);
  }

  if (cuisine) {
    where += ` AND (
      r.cuisine_tags LIKE ? OR
      EXISTS (
        SELECT 1 FROM menu_categories mc
        WHERE mc.restaurant_id = r.id
          AND mc.name LIKE ?
      )
    )`;
    const cuisineTerm = `%${cuisine}%`;
    params.push(cuisineTerm, cuisineTerm);
  }

  const restaurants = await all(
    `SELECT
      r.id, r.name, r.slug, r.plan, r.logo_url, r.cover_url, r.description, r.address, r.delivery_info,
      r.service_area, r.is_open, r.estimated_delivery_minutes, r.cuisine_tags,
      (SELECT COUNT(*) FROM menu_categories c WHERE c.restaurant_id = r.id AND c.is_active = 1) AS category_count,
      (SELECT COUNT(*) FROM menu_items i WHERE i.restaurant_id = r.id AND i.availability != 'hidden') AS item_count
    FROM restaurants r
    ${where}
    ORDER BY r.name ASC`,
    params
  );

  res.json({ restaurants });
});

router.get("/restaurants/:slug", async (req, res) => {
  const restaurant = await get("SELECT * FROM restaurants WHERE slug = ? AND status = 'approved'", [req.params.slug]);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  const categories = await all("SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order", [restaurant.id]);
  const popularItems = await all(
    `SELECT * FROM menu_items
     WHERE restaurant_id = ? AND availability != 'hidden'
     ORDER BY is_popular DESC, sort_order ASC
     LIMIT 6`,
    [restaurant.id]
  );
  const stats = {
    categoryCount: categories.length,
    itemCount: (await get("SELECT COUNT(*) AS count FROM menu_items WHERE restaurant_id = ? AND availability != 'hidden'", [restaurant.id]))?.count || 0,
  };

  res.json({ restaurant, categories, popularItems, stats });
});

router.get("/menu/:slug", async (req, res) => {
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

router.post("/menu/:slug/events", async (req, res) => {
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

module.exports = router;
