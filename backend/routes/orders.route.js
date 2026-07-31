const express = require("express");
const { all, get, run } = require("../data/database");
const { requireAuth } = require("../middleware/auth");
const { getRestaurantForUser } = require("../services/restaurants");

const router = express.Router();

const allowedStatuses = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"];

router.post("/public/restaurants/:slug/orders", async (req, res) => {
  const restaurant = await get("SELECT * FROM restaurants WHERE slug = ? AND status = 'approved'", [req.params.slug]);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Add at least one item to the cart." });

  const customer = req.body.customer || {};
  const customerName = String(customer.name || "").trim();
  const customerPhone = String(customer.phone || "").trim();
  const fulfillmentType = req.body.fulfillment_type === "delivery" ? "delivery" : "pickup";
  if (!customerName || !customerPhone) return res.status(400).json({ error: "Customer name and phone are required." });
  if (fulfillmentType === "delivery" && !String(customer.delivery_address || "").trim()) {
    return res.status(400).json({ error: "Delivery address is required for delivery orders." });
  }

  const menuItems = await all(
    `SELECT id, restaurant_id, name, price, availability
     FROM menu_items
     WHERE restaurant_id = ? AND id IN (${items.map(() => "?").join(",")})`,
    [restaurant.id, ...items.map((item) => item.menu_item_id)]
  );
  const byId = new Map(menuItems.map((item) => [Number(item.id), item]));
  const resolvedItems = [];

  for (const item of items) {
    const menuItem = byId.get(Number(item.menu_item_id));
    if (!menuItem || !["available", "seasonal"].includes(menuItem.availability)) continue;
    const quantity = Math.max(1, Math.min(20, Number(item.quantity) || 1));
    resolvedItems.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price || 0),
      quantity,
      line_total: Number(menuItem.price || 0) * quantity,
      notes: item.notes || "",
    });
  }

  if (!resolvedItems.length) return res.status(400).json({ error: "No available menu items were found in this cart." });

  const subtotal = resolvedItems.reduce((sum, item) => sum + item.line_total, 0);
  const deliveryFee = fulfillmentType === "delivery" ? Number(req.body.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const orderNumber = `DM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const whatsappUrl = buildWhatsAppUrl(restaurant, {
    orderNumber,
    customerName,
    customerPhone,
    fulfillmentType,
    deliveryAddress: customer.delivery_address || "",
    total,
    items: resolvedItems,
  });

  const orderId = await run(
    `INSERT INTO orders (
      restaurant_id, customer_id, order_number, customer_name, customer_phone, customer_email,
      fulfillment_type, delivery_address, notes, subtotal, delivery_fee, total, whatsapp_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurant.id,
      req.user?.role === "customer" ? req.user.id : null,
      orderNumber,
      customerName,
      customerPhone,
      customer.email || "",
      fulfillmentType,
      customer.delivery_address || "",
      req.body.notes || "",
      subtotal,
      deliveryFee,
      total,
      whatsappUrl,
    ]
  );

  for (const item of resolvedItems) {
    await run(
      "INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, line_total, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [orderId, item.menu_item_id, item.name, item.price, item.quantity, item.line_total, item.notes]
    );
  }

  const order = await getOrder(orderId);
  res.status(201).json({ order, whatsapp_url: whatsappUrl });
});

router.get("/orders", requireAuth, async (req, res) => {
  if (req.user.role === "customer") {
    const orders = await all(
      `SELECT o.*, r.name AS restaurant_name, r.slug AS restaurant_slug
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ orders: await withItems(orders) });
  }

  const restaurant = await getRestaurantForUser(req.user);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  const orders = await all("SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC", [restaurant.id]);
  res.json({ orders: await withItems(orders) });
});

router.get("/orders/:id", requireAuth, async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "customer" && order.customer_id !== req.user.id) return res.status(403).json({ error: "Order access denied" });
  if (req.user.role !== "customer") {
    const restaurant = await getRestaurantForUser(req.user);
    if (!restaurant || restaurant.id !== order.restaurant_id) return res.status(403).json({ error: "Order access denied" });
  }

  res.json({ order });
});

router.patch("/orders/:id/status", requireAuth, async (req, res) => {
  if (req.user.role === "customer") return res.status(403).json({ error: "Restaurant access required" });
  const restaurant = await getRestaurantForUser(req.user);
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  const order = await get("SELECT * FROM orders WHERE id = ? AND restaurant_id = ?", [req.params.id, restaurant.id]);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const status = String(req.body.status || "");
  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: "Invalid order status" });

  await run("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND restaurant_id = ?", [status, order.id, restaurant.id]);
  res.json({ order: await getOrder(order.id) });
});

async function getOrder(id) {
  const order = await get("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) return null;
  order.items = await all("SELECT * FROM order_items WHERE order_id = ? ORDER BY id", [order.id]);
  return order;
}

async function withItems(orders) {
  const results = [];
  for (const order of orders) {
    results.push({ ...order, items: await all("SELECT * FROM order_items WHERE order_id = ? ORDER BY id", [order.id]) });
  }
  return results;
}

function buildWhatsAppUrl(restaurant, order) {
  const phone = String(restaurant.whatsapp || restaurant.phone || "").replace(/\D/g, "");
  const itemLines = order.items.map((item) => `${item.quantity}x ${item.name}`).join("\n");
  const message = [
    `New Digi Menu order ${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Type: ${order.fulfillmentType}`,
    order.deliveryAddress ? `Address: ${order.deliveryAddress}` : "",
    "",
    itemLines,
    "",
    `Total: ₦${Number(order.total || 0).toLocaleString("en-NG")}`,
  ].filter(Boolean).join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

module.exports = router;
