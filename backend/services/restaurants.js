const { all, get } = require("../data/database");

async function getRestaurantForUser(user) {
  if (["admin", "super_admin"].includes(user.role)) return get("SELECT * FROM restaurants ORDER BY created_at LIMIT 1");

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
  const [categories, items, qrCode, subscription, invoices, analytics, plan] = await Promise.all([
    all("SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order", [restaurant.id]),
    all("SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort_order", [restaurant.id]),
    get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]),
    get(
      `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.monthly_price, p.features,
        p.max_menu_items, p.max_categories, p.analytics_level, p.support_level, p.trial_days
       FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
       WHERE s.restaurant_id = ?`,
      [restaurant.id]
    ),
    all("SELECT * FROM invoices WHERE restaurant_id = ? ORDER BY issued_at DESC", [restaurant.id]),
    getAnalyticsSummary(restaurant.id),
    get("SELECT * FROM subscription_plans WHERE slug = ?", [restaurant.plan || "starter"])
  ]);

  const resolvedSubscription = subscription || planToSubscription(plan, restaurant);
  return {
    restaurant,
    categories,
    items,
    qrCode,
    subscription: resolvedSubscription,
    invoices,
    analytics,
    planLimits: getPlanLimits(resolvedSubscription),
    profileCompleteness: getProfileCompleteness(restaurant, categories, items, qrCode)
  };
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
  const totals = await get(
    `SELECT
      SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) AS todayVisitors,
      SUM(CASE WHEN created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS weeklyVisitors,
      SUM(CASE WHEN created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS monthlyVisitors,
      SUM(CASE WHEN event_type IN ('whatsapp_click', 'call_click', 'directions_click') THEN 1 ELSE 0 END) AS linkClicks
     FROM analytics_events
     WHERE restaurant_id = ?`,
    [restaurantId]
  );
  const viewedCategories = await all(
    `SELECT mc.name, COUNT(ae.id) AS views
     FROM analytics_events ae JOIN menu_categories mc ON mc.id = ae.category_id
     WHERE ae.restaurant_id = ?
     GROUP BY mc.id, mc.name
     ORDER BY views DESC
     LIMIT 5`,
    [restaurantId]
  );
  const qrScans = rows.find((row) => row.event_type === "qr_scan")?.count || 0;

  return {
    todayVisitors: Number(totals?.todayVisitors || 0),
    weeklyVisitors: Number(totals?.weeklyVisitors || 0),
    monthlyVisitors: Number(totals?.monthlyVisitors || 0),
    linkClicks: Number(totals?.linkClicks || 0),
    averageSession: "1m 42s",
    eventCounts: rows,
    popularItems,
    viewedCategories,
    deviceTypes,
    locations,
    qrScans
  };
}

function planToSubscription(plan, restaurant) {
  const fallback = plan || {
    name: "Starter",
    slug: "starter",
    monthly_price: 5000,
    features: ["Digital menu", "QR code", "Basic analytics", "Up to 30 menu items"],
    max_menu_items: 30,
    max_categories: 8,
    analytics_level: "basic",
    support_level: "standard",
    coupon_code: "STARTER14",
    trial_days: 14
  };
  return {
    status: restaurant.status === "approved" ? "active" : "trial",
    plan_name: fallback.name,
    plan_slug: fallback.slug,
    monthly_price: fallback.monthly_price,
    features: fallback.features,
    max_menu_items: fallback.max_menu_items,
    max_categories: fallback.max_categories,
    analytics_level: fallback.analytics_level,
    support_level: fallback.support_level,
    coupon_code: fallback.coupon_code,
    trial_days: fallback.trial_days
  };
}

function getPlanLimits(subscription) {
  return {
    menuItems: subscription?.max_menu_items || "Unlimited",
    categories: subscription?.max_categories || "Unlimited",
    analytics: subscription?.analytics_level || "basic",
    support: subscription?.support_level || "standard",
    couponCode: subscription?.coupon_code || ""
  };
}

function getProfileCompleteness(restaurant, categories, items, qrCode) {
  const checks = [
    Boolean(restaurant.name),
    Boolean(restaurant.description),
    Boolean(restaurant.phone || restaurant.whatsapp),
    Boolean(restaurant.address),
    Boolean(restaurant.logo_url),
    Boolean(restaurant.cover_url),
    Boolean(categories.length),
    Boolean(items.length),
    Boolean(qrCode?.menu_url)
  ];
  const completed = checks.filter(Boolean).length;
  return {
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100)
  };
}

function deviceFromAgent(agent = "") {
  return /mobile|android|iphone/i.test(agent) ? "mobile" : "desktop";
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

module.exports = { deviceFromAgent, getAnalyticsSummary, getDashboardPayload, getRestaurantForUser, slugify };
