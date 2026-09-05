// Disposable database for browser tests. Never uses the configured application database.
require('dotenv').config();
const mysql = require('mysql2/promise');
const name = `ravi_browser_${process.pid}_${Date.now()}`;
process.env.DB_NAME = name;
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://127.0.0.1:5173';
process.env.BACKEND_BASE_URL = 'http://127.0.0.1:5050';
process.env.PUBLIC_MENU_BASE_URL = 'http://127.0.0.1:5173';
process.env.JWT_SECRET = 'browser-test-only-secret-with-at-least-32-characters';
async function main() {
 const connection = await mysql.createConnection({host:process.env.DB_HOST || 'localhost', user:process.env.DB_USER || 'root', password:process.env.DB_PASSWORD || '', port:Number(process.env.DB_PORT || 3306)});
 await connection.query(`CREATE DATABASE \`${name}\``);
 const db = require('../db');
 const cleanup = async () => { await db.end(); await connection.query(`DROP DATABASE \`${name}\``); await connection.end(); };
 try {
  await require('../data/database').initDatabase();
  await require('../scripts/seed')();
  const server = require('../server').listen(5050,'127.0.0.1',()=>console.log('Browser fixture ready on 5050'));
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close(async()=>{await cleanup();process.exit(0)}));
  server.once('error',async(error)=>{console.error(error.code);await cleanup();process.exit(1)});
 } catch(error) {console.error(error);await cleanup();process.exit(1)}
}
main().catch((error)=>{console.error(error.code);process.exit(1)});
