# Digi Menu

Digi Menu is a restaurant digital menu platform. Customers can browse restaurants on the landing page, search the directory, open a restaurant menu, and view menu items by category. Restaurants can log in to manage their menu, restaurant profile, QR code, analytics, and subscription information.

## Current Scope

- Public restaurant directory on the landing page
- Searchable restaurant cards that link to each public menu
- Public menu pages with category filters and item search
- Restaurant dashboard, menu builder, settings, analytics, QR code, and billing pages
- Admin and super-admin dashboards
- Seeded restaurant accounts, restaurant profiles, menus, subscriptions, QR codes, and analytics events

## Seeded Restaurants

The backend seed creates these approved restaurants:

- 8am Light Kitchen: `/menu/8am-light-kitchen`
- Lola Cafe: `/menu/lola-cafe`
- Suya Street Grill: `/menu/suya-street-grill`
- Bistro Mainland: `/menu/bistro-mainland`
- Ocean Pearl Seafood: `/menu/ocean-pearl-seafood`
- Green Bowl Lagos: `/menu/green-bowl-lagos`
- Mama Ada Kitchen: `/menu/mama-ada-kitchen`

Each restaurant has an owner account and seeded menu data. The default password for seeded accounts is `123456`.

## Demo Access

- Super admin: `superadmin@admin.com` / `123456`
- Admin: `admin@admin.com` / `123456`
- Manager: `manager@digimenu.com` / `123456`
- 8am owner: `8amlight@gmail.com` / `123456`
- Lola Cafe owner: `lola.cafe@digimenu.test` / `123456`

Other seeded restaurant owner emails follow the same pattern shown in `backend/scripts/seed.js`.

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

## Useful Commands

```bash
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm run build
```

The backend runs migrations and seed data on startup. You can also run `cd backend && npm run seed` manually after database credentials are configured.
