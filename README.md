# Ravi Menu

Digital menus, restaurant discovery, QR codes, and direct restaurant orders.
Built with React, Vite, Express, and MySQL.

## September 2026 update

| What was wrong | What changed | Verification |
| --- | --- | --- |
| Signup read insert IDs from a different pooled connection. | Use MySQL’s returned `insertId`. | Concurrent signup with matching owner IDs passes. |
| Failed signup could leave an account without a restaurant. | Restaurant and customer signup now use transactions. | Forced failure rolls back. Retry succeeds. |
| Emails and passwords had weak validation. | Normalize email. Validate input types and lengths. Require 10-character passwords. | Duplicate, malformed, and weak-password requests rejected. |
| Async route failures could escape Express 4. | Upgrade to Express 5. Return safe JSON errors. | Forced database failure returns 500 without SQL details. |
| Guest checkout could recurse through session events. | Emit logout events only when a session existed. | Covered by the guest browser checkout test. |
| The cart button did nothing. | Show real baskets with checkout links. | Desktop and mobile navigation exercised. |
| Demo restaurants appeared in live search results. | Render API results only. Add loading, empty, and retry states. | Search, filters, and outage test. |
| Public menus could silently use demo data. | Remove fallback ordering. Show unavailable state. | Unknown-menu test. |
| UI used fake carts, stale roadmap copy, and prefilled credentials. | New food-led homepage, onboarding, shared UI, real basket, and clear ordering copy. | Desktop/mobile screenshots and browser flows. |
| Delivery fees came from the browser. | Calculate prices and the existing ₦1,000 delivery fee on the server. | Negative fee and fake item prices cannot change totals. |
| Orders could be partially saved. | Save order and line items in one transaction. | API order flow; rollback regression test. |
| Invalid items could disappear silently from checkout. | Reject unavailable items, fractions, duplicates, and oversized baskets. | Invalid-cart tests. |
| Customer orders did not attach the signed-in customer. | Validate optional bearer credentials before checkout. | Customer order history and ownership tests. |
| A menu item could use another restaurant’s category. | Check category ownership on create and update. | Cross-restaurant write rejected. |
| Suspended accounts could keep using tokens. | Check account status at login and on authenticated requests. | Suspended-session tests. |
| Login attempts were unlimited. | Add request limits and security headers. | Rate-limit and header tests. |
| Partial profile updates could serialize empty JSON incorrectly. | Preserve valid JSON defaults for new restaurants. | Settings update regression test. |
| Uploads trusted MIME and original extensions. | Check image signatures. Generate safe extensions and unique names. Restrict roles. | Spoofed-image and customer-upload rejection. |
| Historical migrations installed demo passwords. | New migration `010` suspends known identities still using the exact legacy hash. Historical migrations stay unchanged. | Fresh-install and legacy-upgrade tests. |
| Approval marked invoices paid without payment. | New approval invoices remain pending. | Approval, invoice, and QR tests. |
| Dependencies had reported vulnerabilities. | Update affected packages and lockfiles. | Both npm audits report zero known vulnerabilities. |
| Backend dependencies were committed. | Remove `node_modules` from Git tracking. Keep local installed files. | Dependencies remain reproducible with `npm ci`. |

Historical failed accounts are not deleted automatically. The readiness command detects orphan owners.
Migration `010` suspends exact legacy demo credentials and corrects undated setup invoices. It preserves business data, changed passwords, and dated payments.

## Design references

- [Owner](https://www.owner.com/): clear food discovery and direct-order calls to action.
- [BentoBox](https://www.getbento.com/restaurant-websites-paid/): hospitality-focused photography and accessible digital menus.
- [BentoBox menu guidance](https://help.getbento.com/en/articles/406785): readable menus and clear categories.

The implementation is original. It uses warm cream, forest green, rounded food photography, readable cards, and quieter dashboard panels.
UI previews: [desktop homepage](docs/screenshots/home-desktop.png), [mobile homepage](docs/screenshots/home-mobile.png), [signup](docs/screenshots/register-desktop.png), and [dashboard](docs/screenshots/dashboard-desktop.png).

Homepage photographs are bundled locally. Their Unsplash source IDs are recorded in `frontend/public/images/README.md`.

## Applying the live database update

Migrations `004`, `006`, and `007` are restored to their original versions.
All new database corrections are in `010_production_data_hardening.sql`.
Future database changes must use a new numbered migration. Never edit an applied migration.

After taking a database backup, deploy the updated backend and run with the live database configuration:

```sh
cd backend
npm run migrate
```

The runner skips recorded migrations and applies `010` once. Do not delete migration-history rows or rerun `004`/`006`/`007` manually.

- `010` suspends known demo identities only when their password still matches the exact old seeded hash.
- It changes automatically named setup invoices from paid to pending only when `paid_at` is empty.
- It does not delete users, restaurants, menus, or customer profiles.
- Changed-password accounts and dated payments remain unchanged.
- Demo accounts created by the JavaScript seed can have different bcrypt hashes. The production readiness check still detects their weak passwords.
- Older automatically dated seed invoices need manual reconciliation. Their payment history is ambiguous.
- The updated API keeps new approval invoices pending. Deploy the application update alongside the migration.

This migration was tested on disposable databases, not run against the live database.

## Local setup

Use Node 22.22.0 (`.nvmrc`). Start MySQL and create a `ravi_menu` database.

```sh
cd backend
npm ci
cp .env.example .env
# Set your local database credentials.
npm run migrate
npm start
```

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The API runs on port 5050.
For disposable development data only, run `npm run seed` in `backend`.
The demo seed uses the published password `123456`. Never use these accounts in production.
Seeding is no longer automatic on startup.

## Checks

Verified locally on 2026-09-05: 19 API/security and migration tests and 4 Chrome browser suites pass.
Frontend lint and production build pass. Both dependency audits report zero known vulnerabilities.

```sh
cd backend
npm test
npm run test:integration
npm audit
npm run check:production
```

Integration tests create and delete a unique `ravi_test_*` database.
The configured MySQL user needs permission to create and drop that test database.
The application database is untouched by these tests.

```sh
cd frontend
npm run lint
npm run build
npm audit
```

For browser tests, run `node test/browser-server.js` from `backend`.
It creates a separate `ravi_browser_*` database on port 5050.
Stop it with Ctrl+C to remove its database.
Run Vite with `VITE_API_URL=/api` and `VITE_BACKEND_URL=http://127.0.0.1:5050`.
Then run `npm run test:e2e` from `frontend`.
The browser suite uses installed Google Chrome. Reports and screenshots go to ignored `frontend/test-results`.

## Production status

**Not yet cleared for live deployment.** Local tests do not verify the hosted environment.
The read-only readiness check found these blockers in the existing local configuration:

- The JWT secret needs replacement.
- `NODE_ENV` is not `production`.
- Eleven active accounts still accept the published demo password.

Before launch:

- Rotate or disable the demo accounts. Review historical invoices before treating them as revenue.
- Generate a unique JWT secret. Set `NODE_ENV=production` and HTTPS service URLs.
- Configure the exact proxy hop count. The default trusts no forwarding proxies.
- Configure `VITE_API_URL` before building. Use `/api` only if hosting proxies it to Express.
- Run migrations once before starting production workers. Back up and test restoration first.
- Use persistent upload storage or configure Cloudinary. Ephemeral local uploads are not durable.
- Run the readiness check against the deployment configuration.
- Repeat signup, approval, menu editing, uploads, ordering, and logout on the deployed site.

Current product limits:

- Payment is arranged directly with the restaurant. Online payments are not integrated.
- Delivery uses the existing flat ₦1,000 fee. Serviceability and variable delivery pricing need business rules.
- Email verification and password recovery are not implemented.
- JWTs are stored in browser storage. Logout clears this browser, not other devices.
- Request limits are process-local. Multiple API instances need a shared limiter store.
- Cloudinary, HTTPS hosting, backups, and live provider credentials were not exercised locally.
- This is a scoped local security review, not an independent penetration-test certification.

## Routes

Public: `/`, `/register`, `/login`, `/store/sign-up`, `/restaurants/:slug`, `/menu/:slug`, `/checkout/:slug`.
Restaurant: `/dashboard`, `/menu-builder`, `/orders`, `/kitchen`, `/analytics`, `/qr-code`, `/subscriptions`, `/settings`.
Administration: `/admin-lock`, `/admin`, `/super-admin`.

Owners can set up their business immediately. Public menus remain hidden until admin approval.

## Local CORS and API troubleshooting

Development requests use `/api` through Vite’s proxy to `http://127.0.0.1:5050`.
Start the backend on port 5050, then restart Vite after pulling configuration changes.
Production builds still use `VITE_API_URL`.

A LiteSpeed 503 response without CORS headers means the hosted API is unavailable.
Check the hosting Node application logs and restart the API after resolving the startup error.
Verify the Node version, production JWT secret, database credentials, and dependencies.
Adding an allowed origin does not fix a hosting 503.
The backend accepts comma-separated exact origins in `FRONTEND_URL`.
CORS runs before rate limiting so allowed clients can read API errors.
