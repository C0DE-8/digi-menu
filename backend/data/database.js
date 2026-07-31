const fs = require("fs");
const path = require("path");
const db = require("../db");

const migrationsDir = path.join(__dirname, "..", "migrations");

let initialized = false;

async function initDatabase() {
  if (initialized) return db;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  initialized = true;
  await runMigrations();
  return db;
}

async function runMigrations() {
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const existing = await get("SELECT id FROM schema_migrations WHERE filename = ?", [file]);
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    for (const statement of splitSql(sql)) {
      await db.execute(statement);
    }
    await db.execute("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
  }
}

async function all(sql, params = []) {
  await ensureInitialized();
  const rows = await db.query(sql, params);
  return normalizeRows(rows);
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  await ensureInitialized();
  await db.execute(sql, params);
  const rows = await db.query("SELECT LAST_INSERT_ID() AS id");
  return rows[0]?.id || null;
}

async function ensureInitialized() {
  if (!initialized) await initDatabase();
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const parsed = { ...row };
    for (const key of ["opening_hours", "social_links", "features", "metadata", "cuisine_tags", "preferences"]) {
      if (typeof parsed[key] === "string" && parsed[key]) {
        try {
          parsed[key] = JSON.parse(parsed[key]);
        } catch {
          parsed[key] = row[key];
        }
      }
    }
    return parsed;
  });
}

function splitSql(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

module.exports = { all, get, initDatabase, run };
