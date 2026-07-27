const jwt = require("jsonwebtoken");
const { get } = require("../data/database");

const jwtSecret = process.env.JWT_SECRET || "digi-menu-dev-secret";

async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const payload = jwt.verify(token, jwtSecret);
    const user = await get("SELECT * FROM users WHERE id = ?", [payload.id]);
    if (!user) return res.status(401).json({ error: "Invalid auth token" });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid auth token" });
  }
}

function requireAdmin(req, res, next) {
  if (!["admin", "super_admin"].includes(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  return next();
}

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== "super_admin") return res.status(403).json({ error: "Super admin access required" });
  return next();
}

function publicUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = { publicUser, requireAdmin, requireAuth, requireSuperAdmin };
