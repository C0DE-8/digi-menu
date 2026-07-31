const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const { get, run } = require("../data/database");
const { publicUser, requireAuth } = require("../middleware/auth");
const { getRestaurantForUser, slugify } = require("../services/restaurants");

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "digi-menu-dev-secret";

router.post("/register", async (req, res) => {
  const {
    owner_name,
    email,
    password,
    business_type,
    restaurant_name,
    phone,
    whatsapp,
    address,
    description,
  } = req.body;

  if (!owner_name || !email || !password || !business_type || !restaurant_name || !phone || !address) {
    return res.status(400).json({ error: "Owner name, email, password, business type, restaurant name, phone, and address are required" });
  }

  const existingUser = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (existingUser) return res.status(409).json({ error: "An account with this email already exists" });

  const baseSlug = slugify(restaurant_name);
  const slug = await uniqueRestaurantSlug(baseSlug);
  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = await run("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'owner', 'active')", [
    owner_name,
    email,
    passwordHash
  ]);

  await run(
    `INSERT INTO restaurants (
      owner_id, name, slug, status, plan, business_type, description, phone, whatsapp, email,
      address, google_maps_url, opening_hours, social_links, delivery_info, approval_note
    ) VALUES (?, ?, ?, 'pending', 'starter', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      restaurant_name,
      slug,
      business_type,
      description || "",
      phone,
      whatsapp || phone,
      email,
      address,
      "",
      JSON.stringify({ monday: "8:00 AM - 6:00 PM" }),
      JSON.stringify({}),
      "Pickup or delivery details will be added during onboarding.",
      "Registration submitted. An admin needs to approve this restaurant before the public menu goes live."
    ]
  );

  const user = await get("SELECT * FROM users WHERE id = ?", [userId]);
  const restaurant = await get("SELECT * FROM restaurants WHERE owner_id = ?", [userId]);
  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
  return res.status(201).json({ token, user: publicUser(user), restaurant });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const restaurant = user.role === "super_admin" ? null : await getRestaurantForUser(user);
  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
  return res.json({ token, user: publicUser(user), restaurant });
});

router.get("/me", requireAuth, async (req, res) => {
  const restaurant = req.user.role === "super_admin" ? null : await getRestaurantForUser(req.user);
  res.json({ user: publicUser(req.user), restaurant });
});

async function uniqueRestaurantSlug(baseSlug) {
  const cleanBase = baseSlug || "restaurant";
  let slug = cleanBase;
  let counter = 2;
  while (await get("SELECT id FROM restaurants WHERE slug = ?", [slug])) {
    slug = `${cleanBase}-${counter}`;
    counter += 1;
  }
  return slug;
}

module.exports = router;
