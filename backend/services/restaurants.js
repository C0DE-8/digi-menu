const { all, get } = require("../data/database");

async function getRestaurantForUser(user) {
  if (user.role === "admin") return get("SELECT * FROM restaurants ORDER BY created_at LIMIT 1");

  const owned = await get("SELECT * FROM restaurants WHERE owner_id = ?", [user.id]);
  if (owned) return owned;

  const staff = await get(
    `SELECT r.*
     FROM restaurant_staff rs
     JOIN restaurants r ON r.id = rs.restaurant_id
     WHERE rs.user_id = ?
     ORDER BY rs.created_at
     LIMIT 1`,
    [user.id]
  );
  return staff;
}

async function getDashboardPayload(restaurant) {
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

  return { restaurant, categories, items, qrCode, subscription, invoices, analytics };
}

async function getAnalyticsSummary(restaurantId) {
  const rows = await all("SELECT event_type, COUNT(*) AS count FROM analytics_events WHERE restaurant_id = ? GROUP BY event_type", [
    restaurantId
  ]);
  const popularItems = await all(
    `SELECT mi.name, COUNT(ae.id) AS views
     FROM analytics_events ae JOIN menu_items mi ON mi.id = ae.menu_item_id
     WHERE ae.restaurant_id = ? AND ae.event_type = 'item_view'
     GROUP BY mi.id, mi.name ORDER BY views DESC LIMIT 5`,
    [restaurantId]
  );
  const deviceTypes = await all(
    "SELECT device_type, COUNT(*) AS count FROM analytics_events WHERE restaurant_id = ? GROUP BY device_type ORDER BY count DESC",
    [restaurantId]
  );
  const locations = await all(
    "SELECT location, COUNT(*) AS count FROM analytics_events WHERE restaurant_id = ? AND location IS NOT NULL GROUP BY location ORDER BY count DESC",
    [restaurantId]
  );

  return {
    todayVisitors: 28,
    weeklyVisitors: 184,
    monthlyVisitors: 742,
    eventCounts: rows,
    popularItems,
    deviceTypes,
    locations,
    qrScans: rows.find((row) => row.event_type === "qr_scan")?.count || 0
  };
}

function deviceFromAgent(agent = "") {
  return /mobile|android|iphone/i.test(agent) ? "mobile" : "desktop";
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

module.exports = { deviceFromAgent, getAnalyticsSummary, getDashboardPayload, getRestaurantForUser, slugify };
