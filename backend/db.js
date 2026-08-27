require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "digi_menu",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: false
});

const db = {
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async execute(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result;
  },

  async end() {
    await pool.end();
  }
};

module.exports = db;
