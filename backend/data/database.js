const fs = require("fs");
const path = require("path");
const db = require("../db");

const migrationsDir = path.join(__dirname, "..", "migrations");

let initialized = false;
let initialization;

async function initDatabase() {
  if (initialized) return db;

  if (initialization) return initialization;
  initialization = (async () => {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await runMigrations();
    initialized = true;
    return db;
  })();
  try {
    return await initialization;
  } catch (error) {
    initialization = null;
    throw error;
  }
}

async function runMigrations() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const existing = (
      await db.query("SELECT id FROM schema_migrations WHERE filename = ?", [
        file,
      ])
    )[0];
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    for (const statement of splitSql(sql)) {
      await db.query(statement);
    }
    await db.execute("INSERT INTO schema_migrations (filename) VALUES (?)", [
      file,
    ]);
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
  const result = await db.execute(sql, params);
  return result.insertId || null;
}

async function ensureInitialized() {
  if (!initialized) await initDatabase();
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const parsed = { ...row };
    for (const key of [
      "opening_hours",
      "social_links",
      "features",
      "metadata",
      "cuisine_tags",
      "preferences",
    ]) {
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
    .replace(/^\s*--.*$/gm, "")
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function transaction(work) {
  await ensureInitialized();
  return db.transaction((connection) =>
    work({
      run: async (sql, params = []) =>
        (await connection.execute(sql, params)).insertId || null,
      get: async (sql, params = []) =>
        normalizeRows(await connection.query(sql, params))[0] || null,
    }),
  );
}

module.exports = { all, get, initDatabase, run, transaction };
