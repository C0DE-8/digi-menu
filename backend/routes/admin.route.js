const express = require("express");
const { all, get, run } = require("../data/database");
const { requireAdmin, requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/overview", requireAuth, requireAdmin, async (req, res) => {
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

router.patch("/restaurants/:id/status", requireAuth, requireAdmin, async (req, res) => {
  await run("UPDATE restaurants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.body.status, req.params.id]);
  res.json(await get("SELECT * FROM restaurants WHERE id = ?", [req.params.id]));
});

module.exports = router;
