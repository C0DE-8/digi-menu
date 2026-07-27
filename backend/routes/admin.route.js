const express = require("express");
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
  const payload = {
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
  await run("UPDATE restaurants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.body.status, req.params.id]);
  res.json(await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]));
});

module.exports = router;
