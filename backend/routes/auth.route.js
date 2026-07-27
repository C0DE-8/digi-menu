const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const { get } = require("../data/database");
const { publicUser, requireAuth } = require("../middleware/auth");
const { getRestaurantForUser } = require("../services/restaurants");

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "digi-menu-dev-secret";

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const restaurant = await getRestaurantForUser(user);
  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
  return res.json({ token, user: publicUser(user), restaurant });
});

router.get("/me", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  res.json({ user: publicUser(req.user), restaurant });
});

module.exports = router;
