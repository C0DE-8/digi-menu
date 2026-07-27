const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getDashboardPayload, getRestaurantForUser } = require("../services/restaurants");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  res.json(await getDashboardPayload(restaurant));
});

module.exports = router;
