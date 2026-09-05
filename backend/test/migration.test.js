const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config();

function statements(sql) {
  return sql.replace(/^\s*--.*$/gm, '').split(/;\s*(?:\r?\n|$)/).map(s => s.trim()).filter(Boolean);
}

test('010 upgrades legacy data safely and can be reapplied', async () => {
  const name = `ravi_migration_test_${process.pid}_${Date.now()}`;
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' });
  try {
    await connection.query(`CREATE DATABASE \`${name}\``);
    await connection.query(`USE \`${name}\``);
    const directory = path.join(__dirname, '../migrations');
    for (const file of fs.readdirSync(directory).filter(f => /^00\d_.*\.sql$/.test(f)).sort()) {
      for (const sql of statements(fs.readFileSync(path.join(directory, file), 'utf8'))) await connection.query(sql);
    }
    // A migrated business that already changed its password must retain access.
    await connection.query("UPDATE users SET password_hash = 'changed-password-hash' WHERE email = '8amlight@gmail.com'");
    const [restaurants] = await connection.query('SELECT id, slug FROM restaurants ORDER BY id');
    const restaurant = restaurants[0];
    const [[subscription]] = await connection.query('SELECT s.id, p.name FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id WHERE s.restaurant_id = ? LIMIT 1', [restaurant.id]);
    await connection.query("INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at, description, payment_method) VALUES (?, ?, 5000, ?, 'paid', NULL, ?, 'manual')", [restaurant.id, subscription.id, `RM-${restaurant.slug.toUpperCase()}-PLAN`, `${subscription.name} plan setup`]);
    await connection.query("INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at, description, payment_method) VALUES (?, ?, 5000, 'REAL-PAYMENT', 'paid', CURRENT_TIMESTAMP, 'Actual payment', 'manual')", [restaurant.id, subscription.id]);
    await connection.query("INSERT INTO invoices (restaurant_id, subscription_id, amount, invoice_number, status, paid_at, description, payment_method) VALUES (?, ?, 5000, 'UNRELATED-INVOICE', 'paid', NULL, 'Other invoice', 'manual')", [restaurant.id, subscription.id]);
    const [[before]] = await connection.query('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM restaurants) AS restaurants');
    const migration = statements(fs.readFileSync(path.join(directory, '010_production_data_hardening.sql'), 'utf8'));
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const sql of migration) await connection.query(sql);
      const [[owner]] = await connection.query("SELECT status FROM users WHERE email = '8amlight@gmail.com'");
      assert.equal(owner.status, 'active');
      const [[locked]] = await connection.query("SELECT COUNT(*) AS count FROM users WHERE status = 'suspended'");
      assert.equal(locked.count, 8);
      const [[corrected]] = await connection.query('SELECT status, paid_at FROM invoices WHERE invoice_number = ?', [`RM-${restaurant.slug.toUpperCase()}-PLAN`]);
      assert.equal(corrected.status, 'pending');
      assert.equal(corrected.paid_at, null);
      const [preserved] = await connection.query("SELECT status FROM invoices WHERE invoice_number IN ('REAL-PAYMENT', 'UNRELATED-INVOICE')");
      assert.ok(preserved.every(i => i.status === 'paid'));
      const [[after]] = await connection.query('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM restaurants) AS restaurants');
      assert.deepEqual(after, before);
    }
  } finally {
    await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await connection.end();
  }
});
