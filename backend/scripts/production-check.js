require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');
async function main() {
 const blockers = [];
 const secret = process.env.JWT_SECRET || '';
 if (secret.length < 32 || /replace|dev-secret/i.test(secret)) blockers.push('Set a unique JWT secret of at least 32 characters.');
 if (process.env.NODE_ENV !== 'production') blockers.push('Set NODE_ENV=production.');
 for (const field of ['FRONTEND_URL','BACKEND_BASE_URL','PUBLIC_MENU_BASE_URL']) if (!/^https:\/\//.test(process.env[field] || '')) blockers.push(`Set ${field} to its HTTPS production URL.`);
 const users = await db.query('SELECT id, password_hash FROM users WHERE status = ?', ['active']);
 let weak = 0;
 for (const user of users) if (await bcrypt.compare('123456', user.password_hash)) weak++;
 if (weak) blockers.push(`${weak} active accounts still accept the published demo password. Rotate or disable them.`);
 const [orphan] = await db.query("SELECT COUNT(*) AS count FROM users u LEFT JOIN restaurants r ON r.owner_id = u.id WHERE u.role = 'owner' AND r.id IS NULL");
 if (orphan.count) blockers.push(`${orphan.count} owner accounts have no restaurant. Review and repair these before launch.`);
 blockers.forEach((message)=>console.log(`BLOCKED: ${message}`));
 console.log(blockers.length ? `${blockers.length} configuration/data blockers found.` : 'Configuration/data checks passed. Complete the deployment checks in README.md.');
 process.exitCode = blockers.length ? 1 : 0;
}
main().catch((error)=>{console.error('Readiness check failed:',error.code || error.name);process.exitCode=1}).finally(()=>db.end());
