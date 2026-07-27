const express = require("express");
const { get, run } = require("../data/database");
const { requireAuth } = require("../middleware/auth");
const { getRestaurantForUser, slugify } = require("../services/restaurants");

const router = express.Router();

router.post("/categories", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const { name, description } = req.body;
  const sort = await get("SELECT COUNT(*) AS count FROM menu_categories WHERE restaurant_id = ?", [restaurant.id]);
  const id = await run("INSERT INTO menu_categories (restaurant_id, name, slug, description, sort_order) VALUES (?, ?, ?, ?, ?)", [
    restaurant.id,
    name,
    slugify(name),
    description || "",
    sort.count + 1
  ]);
  res.status(201).json(await get("SELECT * FROM menu_categories WHERE id = ?", [id]));
});

router.post("/items", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const item = req.body;
  const id = await run(
    `INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price, image_url, prep_time, availability,
      is_popular, is_new, is_spicy, is_vegetarian, is_vegan, is_halal, is_gluten_free, ingredients, calories, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurant.id,
      item.category_id,
      item.name,
      item.description || "",
      Number(item.price || 0),
      item.image_url || "",
      item.prep_time || "",
      item.availability || "available",
      Number(Boolean(item.is_popular)),
      Number(Boolean(item.is_new)),
      Number(Boolean(item.is_spicy)),
      Number(Boolean(item.is_vegetarian)),
      Number(Boolean(item.is_vegan)),
      Number(Boolean(item.is_halal)),
      Number(Boolean(item.is_gluten_free)),
      item.ingredients || "",
      item.calories || null,
      item.sort_order || 0
    ]
  );
  res.status(201).json(await get("SELECT * FROM menu_items WHERE id = ?", [id]));
});

router.put("/items/:id", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const existing = await get("SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?", [req.params.id, restaurant.id]);
  if (!existing) return res.status(404).json({ error: "Menu item not found" });

  const item = { ...existing, ...req.body };
  const categoryId = item.category_id || existing.category_id;
  const category = await get("SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?", [categoryId, restaurant.id]);
  if (!category) return res.status(400).json({ error: "Category does not belong to this restaurant" });

  await run(
    `UPDATE menu_items SET
      category_id = ?, name = ?, description = ?, price = ?, image_url = ?, prep_time = ?, availability = ?,
      is_popular = ?, is_new = ?, is_spicy = ?, is_vegetarian = ?, is_vegan = ?, is_halal = ?, is_gluten_free = ?,
      ingredients = ?, calories = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND restaurant_id = ?`,
    [
      categoryId,
      item.name,
      item.description || "",
      Number(item.price || 0),
      item.image_url || "",
      item.prep_time || "",
      item.availability || "available",
      Number(Boolean(item.is_popular)),
      Number(Boolean(item.is_new)),
      Number(Boolean(item.is_spicy)),
      Number(Boolean(item.is_vegetarian)),
      Number(Boolean(item.is_vegan)),
      Number(Boolean(item.is_halal)),
      Number(Boolean(item.is_gluten_free)),
      item.ingredients || "",
      item.calories || null,
      item.sort_order || 0,
      existing.id,
      restaurant.id
    ]
  );

  res.json(await get("SELECT * FROM menu_items WHERE id = ?", [existing.id]));
});

router.patch("/items/:id/availability", requireAuth, async (req, res) => {
  const restaurant = await getRestaurantForUser(req.user);
  const availability = req.body.availability === "hidden" ? "hidden" : "available";
  const existing = await get("SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?", [req.params.id, restaurant.id]);
  if (!existing) return res.status(404).json({ error: "Menu item not found" });

  await run("UPDATE menu_items SET availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND restaurant_id = ?", [
    availability,
    existing.id,
    restaurant.id
  ]);
  res.json(await get("SELECT * FROM menu_items WHERE id = ?", [existing.id]));
});

module.exports = router;
