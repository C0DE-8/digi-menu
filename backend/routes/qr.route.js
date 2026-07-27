const express = require("express");
const QRCode = require("qrcode");
const { get, run } = require("../data/database");
const { requireAuth } = require("../middleware/auth");
const { getRestaurantForUser } = require("../services/restaurants");

const router = express.Router();

router.post("/regenerate", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const menuUrl = `${process.env.PUBLIC_MENU_BASE_URL || "http://localhost:5173"}/menu/${restaurant.slug}`;
  const image = await QRCode.toDataURL(menuUrl);
  const existing = await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]);
  if (existing) await run("UPDATE qr_codes SET menu_url = ?, image_data_url = ? WHERE restaurant_id = ?", [menuUrl, image, restaurant.id]);
  else await run("INSERT INTO qr_codes (restaurant_id, menu_url, image_data_url) VALUES (?, ?, ?)", [restaurant.id, menuUrl, image]);
  res.json(await get("SELECT * FROM qr_codes WHERE restaurant_id = ?", [restaurant.id]));
});

module.exports = router;
