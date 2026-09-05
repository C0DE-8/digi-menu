const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();
const mysql = require('mysql2/promise');
const databaseName = `ravi_test_${process.pid}_${Date.now()}`;
process.env.DB_NAME = databaseName;
process.env.JWT_SECRET = 'integration-test-only-secret-at-least-32-characters';
process.env.NODE_ENV = 'test';
let adminConnection, db, database, server, base, owner, second, customer, category, item, order;
const registration = (email, name = 'Test Kitchen') => ({ owner_name:'Test Owner', email, password:'A-good-test-password', business_type:'restaurant', restaurant_name:name, phone:'+2348001234567', address:'Lagos' });
async function request(path, method = 'GET', body, token) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status:response.status, data:await response.json(), headers:response.headers };
}
before(async () => {
  adminConnection = await mysql.createConnection({ host:process.env.DB_HOST || 'localhost', port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USER || 'root', password:process.env.DB_PASSWORD || '' });
  await adminConnection.query(`CREATE DATABASE \`${databaseName}\``);
  db = require('../db'); database = require('../data/database');
  await database.initDatabase();
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.end();
  if (adminConnection) { await adminConnection.query(`DROP DATABASE \`${databaseName}\``); await adminConnection.end(); }
});
test('fresh migrations suspend legacy seeded credentials', async () => {
 const users = await database.all('SELECT status FROM users WHERE password_hash = ?', ['$2b$10$x32vkXRKuCkIZNnwABUReOaVtrqAOplWGC6zbAXFPPdmjjndX459e']);
 assert.equal(users.length, 9);
 assert.ok(users.every(user => user.status === 'suspended'));
});
test('registers restaurant with correct owner ID and normalized email', async () => {
 const r = await request('/auth/register','POST',registration(' Owner@Example.test ')); assert.equal(r.status,201); owner=r.data;
 assert.equal(owner.restaurant.owner_id,owner.user.id); assert.equal(owner.user.email,'owner@example.test'); assert.equal(owner.restaurant.status,'pending'); assert.equal(owner.user.password_hash,undefined);
});
test('rejects duplicate emails, short passwords, invalid types and injection-shaped inputs', async () => {
 for (const [body,status] of [[registration('OWNER@example.test'),409],[{...registration('bad@example.test'),password:'123456'},400],[{...registration('bad@example.test'),business_type:'admin'},400],[{...registration('bad@example.test'),email:{$ne:null}},400]]) assert.equal((await request('/auth/register','POST',body)).status,status);
});
test('creates independent accounts concurrently with distinct correct IDs', async () => {
 const results=await Promise.all(Array.from({length:4},(_,i)=>request('/auth/register','POST',registration(`parallel${i}@example.test`,`Parallel Kitchen ${i}`))));
 results.forEach(r=>{assert.equal(r.status,201);assert.equal(r.data.restaurant.owner_id,r.data.user.id)}); assert.equal(new Set(results.map(r=>r.data.user.id)).size,4);second=results[0].data;
});
test('rolls back account insert when restaurant insert fails', async () => {
 await db.query("CREATE TRIGGER reject_test_restaurant BEFORE INSERT ON restaurants FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forced test failure'");
 try { assert.equal((await request('/auth/register','POST',registration('rollback@example.test'))).status,500); assert.equal(await database.get('SELECT id FROM users WHERE email = ?',['rollback@example.test']),null); }
 finally { await db.query('DROP TRIGGER reject_test_restaurant'); }
 assert.equal((await request('/auth/register','POST',registration('rollback@example.test'))).status,201);
});
test('login, session validation, anonymous and forged-token rejection', async () => {
 assert.equal((await request('/auth/login','POST',{email:' OWNER@example.test ',password:'A-good-test-password'})).status,200);
 assert.equal((await request('/auth/me','GET',undefined,owner.token)).data.user.id,owner.user.id);
 assert.equal((await request('/dashboard')).status,401); assert.equal((await request('/dashboard','GET',undefined,'forged')).status,401);
 assert.equal((await request('/auth/login','POST',{email:"' OR 1=1 --",password:'wrong'})).status,401);
});
test('pending restaurants have a usable dashboard but no public menu', async () => {
 assert.equal((await request('/dashboard','GET',undefined,owner.token)).status,200);assert.equal((await request(`/public/menu/${owner.restaurant.slug}`)).status,404);
});
test('creates categories/items and rejects cross-restaurant category injection', async () => {
 let r=await request('/categories','POST',{name:'Lunch'},owner.token);assert.equal(r.status,201);category=r.data;
 r=await request('/items','POST',{category_id:category.id,name:'Jollof',price:4500},owner.token);assert.equal(r.status,201);item=r.data;
 assert.equal((await request('/items','POST',{category_id:category.id,name:'Stolen category',price:10},second.token)).status,400);
 assert.equal((await request(`/items/${item.id}`,'PUT',{price:100},second.token)).status,404);
 assert.equal((await request(`/items/${item.id}`,'PUT',{price:-100},owner.token)).status,400);
 assert.equal((await request(`/items/${item.id}`,'PUT',{description:'Fresh party rice'},owner.token)).status,200);
});
test('customer signup and role isolation', async () => {
 const r=await request('/auth/customers/register','POST',{name:'Customer',email:'customer@example.test',password:'Customer-password',phone:'08001234567'});assert.equal(r.status,201);customer=r.data;
 for (const path of ['/categories','/items','/qr/regenerate']) assert.equal((await request(path,'POST',{},customer.token)).status,403);
 assert.equal((await request('/admin/overview','GET',undefined,owner.token)).status,403);
 assert.equal((await request('/admin/settings/upload-provider','PUT',{upload_provider:'local'},owner.token)).status,403);
});
test('admin approval publishes menu and creates unpaid invoice + QR', async () => {
 const adminId=await database.run("INSERT INTO users (name,email,password_hash,role) VALUES ('Admin','admin@example.test','unused','admin')");
 const token=require('jsonwebtoken').sign({id:adminId},process.env.JWT_SECRET);
 assert.equal((await request(`/admin/restaurants/${owner.restaurant.id}/status`,'PATCH',{status:'approved'},token)).status,200);
 assert.equal((await request(`/public/menu/${owner.restaurant.slug}`)).status,200);
 assert.equal((await database.get('SELECT status FROM invoices WHERE restaurant_id = ?',[owner.restaurant.id])).status,'pending');
 assert.ok((await request('/qr/regenerate','POST',{},owner.token)).data.image_data_url.startsWith('data:image/png'));
 await database.run('UPDATE restaurants SET is_open = 1 WHERE id = ?',[owner.restaurant.id]);
});
const basket = () => ({fulfillment_type:'delivery',delivery_fee:-99999,customer:{name:'Customer',phone:'08001234567',delivery_address:'Lagos'},items:[{menu_item_id:item.id,quantity:2,price:1}]});
test('checkout uses server prices/fees and links authenticated customer', async () => {
 const r=await request(`/public/restaurants/${owner.restaurant.slug}/orders`,'POST',basket(),customer.token);assert.equal(r.status,201);order=r.data.order;assert.equal(order.total,10000);assert.equal(order.delivery_fee,1000);assert.equal(order.customer_id,customer.user.id);assert.equal(order.items.length,1);assert.equal(order.payment_status,'unpaid');
});
test('rejects fractional quantities and unavailable/foreign items', async () => {
 const path=`/public/restaurants/${owner.restaurant.slug}/orders`;
 assert.equal((await request(path,'POST',{...basket(),items:[{menu_item_id:item.id,quantity:1.5}]})).status,400);
 assert.equal((await request(path,'POST',{...basket(),items:[{menu_item_id:999999,quantity:1}]})).status,409);
 await request(`/items/${item.id}/availability`,'PATCH',{availability:'out_of_stock'},owner.token);
 assert.equal((await request(path,'POST',basket())).status,409);
 await request(`/items/${item.id}/availability`,'PATCH',{availability:'available'},owner.token);
});
test('orders stay isolated and kitchen status updates persist', async () => {
 assert.equal((await request(`/orders/${order.id}`,'GET',undefined,second.token)).status,403);
 assert.equal((await request(`/orders/${order.id}/status`,'PATCH',{status:'ready'},customer.token)).status,403);
 assert.equal((await request(`/orders/${order.id}/status`,'PATCH',{status:'preparing'},owner.token)).data.order.status,'preparing');
 assert.equal((await request('/orders','GET',undefined,customer.token)).data.orders[0].id,order.id);
});
test('suspended accounts cannot login or reuse existing sessions', async () => {
 await database.run("UPDATE users SET status = 'suspended' WHERE id = ?",[second.user.id]);
 assert.equal((await request('/auth/me','GET',undefined,second.token)).status,401);
 assert.equal((await request('/auth/login','POST',{email:second.user.email,password:'A-good-test-password'})).status,401);
});
test('upload rejects spoofed image content and customer role', async () => {
 const form=new FormData();form.append('image',new Blob(['<script>alert(1)</script>'],{type:'image/png'}),'attack.html');
 const r=await fetch(base+'/uploads/menu-items',{method:'POST',headers:{Authorization:`Bearer ${owner.token}`},body:form});assert.equal(r.status,400);
 assert.equal((await fetch(base+'/uploads/menu-items',{method:'POST',headers:{Authorization:`Bearer ${customer.token}`},body:form})).status,403);
});
test('order transaction rolls back if a line insert fails', async () => {
 const before = (await database.get('SELECT COUNT(*) AS count FROM orders')).count;
 await db.query("CREATE TRIGGER reject_test_line BEFORE INSERT ON order_items FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forced line failure'");
 try {
  assert.equal((await request(`/public/restaurants/${owner.restaurant.slug}/orders`,'POST',basket())).status,500);
  assert.equal((await database.get('SELECT COUNT(*) AS count FROM orders')).count,before);
 } finally { await db.query('DROP TRIGGER reject_test_line'); }
});
test('profile settings persist, valid uploads work, and unsafe URLs are rejected', async () => {
 assert.equal((await request('/restaurant','PUT',{description:'Updated kitchen profile',service_area:'Lekki'},owner.token)).data.description,'Updated kitchen profile');
 assert.equal((await request('/restaurant','PUT',{google_maps_url:'javascript:alert(1)'},owner.token)).status,400);
 const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64');
 const form = new FormData(); form.append('image',new Blob([bytes],{type:'image/png'}),'logo.png');
 const response = await fetch(base+'/uploads/restaurant-assets/logo',{method:'POST',headers:{Authorization:`Bearer ${owner.token}`},body:form});
 assert.equal(response.status,201);const asset = await response.json();assert.match(asset.filename,/\.png$/);
 const fs = require('fs');const path = require('path');fs.unlinkSync(path.join(require('../services/upload-storage').ensureLocalUploadDirs().restaurantAssetsDir,asset.filename));
});
test('security headers, bounded login attempts and safe errors', async () => {
 const r=await request('/auth/me');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('x-powered-by'),null);
 let status;for(let i=0;i<45;i++) status=(await request('/auth/login','POST',{})).status;assert.equal(status,429);
});
