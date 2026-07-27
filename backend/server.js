require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { initDatabase } = require("./data/database");
const seed = require("./scripts/seed");

const app = express();
const port = Number(process.env.PORT || 5050);

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({ ok: true, service: "digi-menu-api" });
});

app.get("/health", async (req, res) => {
  try {
    await initDatabase();
    res.json({ ok: true, app: "Digi Menu", database: "ready" });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/dashboard", require("./routes/dashboard.route"));
app.use("/api/restaurant", require("./routes/restaurant.route"));
app.use("/api", require("./routes/menu.route"));
app.use("/api/public", require("./routes/public.route"));
app.use("/api/admin", require("./routes/admin.route"));
app.use("/api/qr", require("./routes/qr.route"));

async function start() {
  await initDatabase();
  await seed();
  const server = app.listen(port, () => {
    console.log(`Digi Menu API listening on http://localhost:${port}`);
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
