require("dotenv").config();

const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const db = require("./db");
require("./services/jwt-secret");
const cors = require("cors");
const express = require("express");
const { initDatabase } = require("./data/database");
const seed = require("./scripts/seed");
const { ensureLocalUploadDirs } = require("./services/upload-storage");

const app = express();
const port = Number(process.env.PORT || 5050);
const allowedOrigins = String(process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many attempts. Please try again in 15 minutes." } }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 200, standardHeaders: "draft-8", legacyHeaders: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => { req.body ||= {}; next(); });
app.use("/uploads", express.static(ensureLocalUploadDirs().root));

app.get("/", (req, res) => {
  res.json({ ok: true, service: "ravi-menu-api" });
});

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, app: "Ravi Menu", database: "ready" });
  } catch (error) {
    res.status(503).json({ ok: false, error: "Database unavailable" });
  }
});

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/dashboard", require("./routes/dashboard.route"));
app.use("/api/restaurant", require("./routes/restaurant.route"));
app.use("/api", require("./routes/menu.route"));
app.use("/api/uploads", require("./routes/upload.route"));
app.use("/api/public", require("./routes/public.route"));
app.use("/api", require("./routes/orders.route"));
app.use("/api/admin", require("./routes/admin.route"));
app.use("/api/qr", require("./routes/qr.route"));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "An account or business with these details already exists. Please sign in or use different details." });
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  if (status === 500) console.error("Request failed:", error.code || error.name);
  res.status(status).json({ error: status === 500 ? "Something went wrong. Please try again." : "Invalid request." });
});

async function start() {
  await initDatabase();
  if (process.env.SEED_DEMO === "true" && process.env.NODE_ENV !== "production") await seed();
  const server = app.listen(port, () => {
    console.log(`Ravi Menu API listening on http://localhost:${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Set PORT to another value.`);
      process.exit(1);
    }
    throw error;
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
