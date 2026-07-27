const express = require("express");
const { get, run } = require("../data/database");
const { requireAuth } = require("../middleware/auth");
const { getRestaurantForUser } = require("../services/restaurants");

const router = express.Router();

router.put("/", requireAuth, async (req, res) => {
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

module.exports = router;
