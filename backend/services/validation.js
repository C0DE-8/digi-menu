function normalizeEmail(value) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }
function validateRegistration(body, customer) {
  const required = customer ? ["name", "email", "password", "phone"] : ["owner_name", "email", "password", "phone", "restaurant_name", "address", "business_type"];
  if (required.some((key) => typeof body[key] !== "string" || !body[key].trim())) return "Complete all required fields.";
  const limits = { name:160, owner_name:160, email:190, phone:80, whatsapp:80, restaurant_name:180, address:2000, description:5000, delivery_address:2000, city:120 };
  for (const [key, max] of Object.entries(limits)) if (body[key] != null && (typeof body[key] !== "string" || body[key].length > max)) return `${key.replaceAll("_", " ")} is invalid or too long.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(body.email))) return "Enter a valid email address.";
  if (body.password.length < 10 || Buffer.byteLength(body.password) > 72) return "Use a password with at least 10 characters and at most 72 bytes.";
  if (!customer && !["restaurant", "shop"].includes(body.business_type)) return "Choose Restaurant or Shop.";
  if (customer && body.preferences != null && (!Array.isArray(body.preferences) || body.preferences.length > 20 || body.preferences.some((v) => typeof v !== "string" || v.length > 80))) return "Invalid preferences.";
  return null;
}
module.exports = { normalizeEmail, validateRegistration };
