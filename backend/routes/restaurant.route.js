const express = require("express");
const { get, run } = require("../data/database");
const { requireAuth } = require("../middleware/auth");
const { getRestaurantForUser } = require("../services/restaurants");

const router = express.Router();

router.put("/", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  for (const field of ["logo_url", "cover_url", "google_maps_url"]) {
    const value = req.body[field];
    if (value && (typeof value !== "string" || !/^(https?:\/\/|\/uploads\/)/i.test(value))) return res.status(400).json({ error: "Use a valid HTTP or HTTPS image/map URL" });
  }
  if (req.body.name != null && (typeof req.body.name !== "string" || !req.body.name.trim() || req.body.name.length > 180)) return res.status(400).json({ error: "Enter a business name of at most 180 characters" });
  const fields = [
    "name",
    "business_type",
    "description",
    "phone",
    "whatsapp",
    "email",
    "address",
    "google_maps_url",
    "delivery_info",
    "logo_url",
    "cover_url",
    "service_area",
    "is_open",
    "estimated_delivery_minutes",
    "cuisine_tags",
    "opening_hours",
    "social_links"
  ];
  const jsonFields = ["opening_hours", "social_links", "cuisine_tags"];
  for (const field of jsonFields) {
    if (typeof req.body[field] === "string") {
      try { req.body[field] = JSON.parse(req.body[field]); } catch { return res.status(400).json({ error: `Invalid ${field}` }); }
    }
    if (req.body[field] != null && (field === "cuisine_tags" ? !Array.isArray(req.body[field]) : typeof req.body[field] !== "object" || Array.isArray(req.body[field]))) return res.status(400).json({ error: `Invalid ${field}` });
  }
  const values = fields.map((field) => {
    if (jsonFields.includes(field)) return JSON.stringify(req.body[field] ?? restaurant[field] ?? (field === "cuisine_tags" ? [] : {}));
    return req.body[field] ?? restaurant[field] ?? "";
  });
  await run(`UPDATE restaurants SET ${fields.map((field) => `${field} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
    ...values,
    restaurant.id
  ]);
  res.json(await get("SELECT * FROM restaurants WHERE id = ?", [restaurant.id]));
});

module.exports = router;
