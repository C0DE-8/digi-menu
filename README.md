# Ravi Menu

Ravi Menu is a restaurant and shop digital menu platform. It now covers vendor onboarding, admin approval, public restaurant discovery, customer registration, public menus, cart checkout, and a restaurant-side order workflow.

The product is still in testing, but it has moved past the original demo-only phase.

## Current Scope

- Public landing page with restaurant discovery, search, area filters, cuisine filters, cookie consent, and cart preview.
- Public restaurant cards that open restaurant detail pages at `/restaurants/:slug`.
- Public menu pages at `/menu/:slug` with category filters, item search, item detail modal, and add-to-cart controls.
- Customer signup at `/store/sign-up` and `/customer/sign-up`.
- Customer cart stored locally per restaurant.
- Checkout at `/checkout/:slug` with pickup/delivery choice, customer details, notes, order totals, and WhatsApp confirmation fallback.
- Restaurant registration at `/register` with business type selection for `Restaurant` and `Shop`.
- Restaurant owner dashboard with onboarding checklist, profile completeness, analytics, QR, billing, settings, uploadable logo/cover, opening hours, social links, delivery info, cuisine tags, service area, and open/closed status.
- Restaurant order dashboard at `/orders`.
- Kitchen active ticket view at `/kitchen`.
- Admin approval dashboard at `/admin`.
- Super admin dashboard at `/super-admin`.
- Seeded restaurant, customer, admin, manager, subscription, QR, analytics, and order-ready menu data.

## User Roles

- `customer`: browses restaurants, creates a customer account, builds a cart, and submits checkout orders.
- `owner`: manages one restaurant or shop account.
- `manager`: staff access for restaurant management.
- `admin`: reviews and approves/rejects restaurants.
- `super_admin`: platform-level admin access.

Logged-out users should only see public navigation: Home, Restaurants, Customer sign up, Start selling, cart, and Login. Restaurant dashboard links are hidden until a restaurant/admin user is logged in.

## Main Routes

Public/customer:

- `/`
- `/store/sign-up`
- `/customer/sign-up`
- `/login`
- `/restaurants/:slug`
- `/menu/:slug`
- `/checkout/:slug`

Restaurant:

- `/dashboard`
- `/menu-builder`
- `/orders`
- `/kitchen`
- `/analytics`
- `/qr-code`
- `/subscriptions`
- `/settings`

Admin:

- `/admin`
- `/super-admin`

## Ordering MVP

Phase 4 is complete as an MVP:

- Customers add menu items to a cart from public menus.
- Cart persists in `localStorage` by restaurant slug.
- Checkout supports pickup and delivery.
- Orders are saved in `orders` and `order_items`.
- Restaurants can update order status: `pending`, `accepted`, `preparing`, `ready`, `completed`, `cancelled`.
- Kitchen view shows active tickets only.
- Since real payment is Phase 5, created orders include a WhatsApp confirmation link.

## Seeded Restaurants

The backend seed creates these approved restaurants:

- 8am Light Kitchen: `/menu/8am-light-kitchen`
- Lola Cafe: `/menu/lola-cafe`
- Suya Street Grill: `/menu/suya-street-grill`
- Bistro Mainland: `/menu/bistro-mainland`
- Ocean Pearl Seafood: `/menu/ocean-pearl-seafood`
- Green Bowl Lagos: `/menu/green-bowl-lagos`
- Mama Ada Kitchen: `/menu/mama-ada-kitchen`

Each seeded restaurant has an owner account, profile data, service area, cuisine tags, open/closed status, menu categories, menu items, subscription data, QR data, and analytics events.

## Demo Access

Default password for seeded accounts is `123456`.

- Super admin: `superadmin@ravimenu.com`
- Admin: `admin@ravimenu.com`
- Manager: `manager@ravimenu.com`
- Demo customer: `customer@ravimenu.com`
- 8am owner: `8amlight@gmail.com`
- Lola Cafe owner: `lola.cafe@ravimenu.test`
- Suya Street owner: `suya.street@ravimenu.test`
- Bistro Mainland owner: `bistro.mainland@ravimenu.test`
- Ocean Pearl owner: `ocean.pearl@ravimenu.test`
- Green Bowl owner: `green.bowl@ravimenu.test`
- Mama Ada owner: `mama.ada@ravimenu.test`

## Local Setup

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5050`

Production URLs:

- Frontend: `https://ravimenu.com`
- Backend API: `https://api.ravimenu.com`

## Database

Migrations live in `backend/migrations` and run through `backend/data/database.js`.

Run migrations manually:

```bash
cd backend
npm run migrate
```

The backend also runs migrations and seed data on startup.

## Useful Commands

```bash
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm run build
```

Current build note: Vite warns when Node is `20.17.0` because it prefers Node `20.19+` or `22.12+`. The production build still completes in the current environment.

## Roadmap

Completed:

- Phase 1: Menu platform foundation.
- Phase 2: Restaurant approval, analytics, plans, invoices, and onboarding polish.
- Phase 3: Customer discovery.
- Phase 4: Ordering MVP.

Next:

- Phase 5: real payments for subscriptions and customer orders.
- Phase 6: deeper restaurant operations: POS/walk-in orders, kitchen display upgrades, receipts, inventory, ingredients, food cost, and accounting.

Known gaps:

- Email/phone verification is not implemented.
- Payment provider integration is not implemented.
- Subscription payment collection is still mocked/basic.
- Customer order payment is not implemented.
- Admin support/moderation workflows are still basic.
- Analytics are improved but not fully event-driven for every order/customer action.
