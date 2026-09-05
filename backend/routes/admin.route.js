const express = require("express");
const QRCode = require("qrcode");
const { all, get, run } = require("../data/database");
const { requireAdmin, requireAuth, requireSuperAdmin } = require("../middleware/auth");
const { UPLOAD_PROVIDERS, getUploadSettings, setCloudinarySettings, setSetting } = require("../services/system-settings");

const router = express.Router();

router.get("/overview", requireAuth, requireAdmin, async (req, res) => {
  const restaurants = await all("SELECT * FROM restaurants ORDER BY created_at DESC");
  const users = await all("SELECT id, name, email, role, status, created_at FROM users WHERE role != 'super_admin' ORDER BY created_at DESC");
  const tickets = await all("SELECT * FROM support_tickets ORDER BY created_at DESC");
  const reports = await all("SELECT * FROM content_reports ORDER BY created_at DESC");
  const revenue = await get("SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'paid'");
  const expiredSubscriptions = await get("SELECT COUNT(*) AS count FROM subscriptions WHERE ends_at IS NOT NULL AND ends_at < CURRENT_DATE");
  const payload = {
    stats: {
      restaurants: restaurants.length,
      activeRestaurants: restaurants.filter((item) => item.status === "approved").length,
      pendingRestaurants: restaurants.filter((item) => item.status === "pending").length,
      rejectedRestaurants: restaurants.filter((item) => item.status === "rejected").length,
      expiredSubscriptions: expiredSubscriptions.count,
      revenue: revenue.total
    },
    restaurants,
    users,
    tickets,
    reports
  };

  if (req.user.role === "super_admin") {
    payload.settings = {
      ...(await getUploadSettings()),
      canManageSystem: true
    };
  }

  res.json(payload);
});

router.put("/settings/upload-provider", requireAuth, requireSuperAdmin, async (req, res) => {
  const provider = String(req.body.upload_provider || "");
  if (!UPLOAD_PROVIDERS.has(provider)) {
    res.status(400).json({ error: "Upload provider must be cloudinary or local" });
    return;
  }

  await setSetting("upload_provider", provider);
  const settings = await getUploadSettings();
  res.json({ ...settings, canManageSystem: true });
});

router.put("/settings/cloudinary", requireAuth, requireSuperAdmin, async (req, res) => {
  const cloudinary = await setCloudinarySettings({
    cloudName: req.body.cloud_name,
    apiKey: req.body.api_key,
    apiSecret: req.body.api_secret,
    folder: req.body.folder,
  });
  const settings = await getUploadSettings();
  res.json({ ...settings, cloudinary, canManageSystem: true });
});

router.patch("/restaurants/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const status = ["approved", "rejected", "pending"].includes(req.body.status) ? req.body.status : "pending";
  const note = String(req.body.approval_note || "").trim();
  await run("UPDATE restaurants SET status = ?, approval_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, note, req.params.id]);
  if (status === "approved") {
    await ensureApprovedRestaurantSetup(req.params.id);
  }
  res.json(await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]));
});

async function ensureApprovedRestaurantSetup(restaurantId) {
  const restaurant = await get("SELECT * FROM restaurants WHERE id = ?", [restaurantId]);
  const plan = await get("SELECT * FROM subscription_plans WHERE slug = ?", [restaurant.plan || "starter"]);
  const subscription = await get("SELECT * FROM subscriptions WHERE restaurant_id = ?", [restaurant.id]);
  if (!subscription && plan) {
    await run(
      "INSERT INTO subscriptions (restaurant_id, plan_id, status, starts_at, ends_at, trial_ends_at, coupon_code) VALUES (?, ?, 'active', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), DATE_ADD(CURRENT_DATE, INTERVAL COALESCE(?, 14) DAY), ?)",
      [restaurant.id, plan.id, plan.trial_days, plan.coupon_code]
    );
  }
  const activeSubscription = await get("SELECT * FROM subscriptions WHERE restaurant_id = ?", [restaurant.id]);
  const invoice = await get("SELECT * FROM invoices WHERE restaurant_id = ?", [restaurant.id]);
  if (!invoice && activeSubscription && plan) {
    await run(
      "INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at, description, payment_method) VALUES (?, ?, ?, ?, 'pending', NULL, ?, 'manual')",
      [restaurant.id, activeSubscription.id, plan.monthly_price || 0, `RM-${restaurant.slug.toUpperCase()}-PLAN`, `${plan.name} plan setup`]
    );
  }

  const baseUrl = String(process.env.PUBLIC_MENU_BASE_URL || "https://ravimenu.com").replace(/\/$/, "");
  const menuUrl = `${baseUrl}/menu/${restaurant.slug}`;
  const qrCode = await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]);
  const image = await QRCode.toDataURL(menuUrl);
  if (qrCode) await run("UPDATE qr_codes SET menu_url = ?, image_data_url = ? WHERE restaurant_id = ?", [menuUrl, image, restaurant.id]);
  else await run("INSERT INTO qr_codes (restaurant_id, menu_url, image_data_url, scans) VALUES (?, ?, ?, 0)", [restaurant.id, menuUrl, image]);
}

module.exports = router;
