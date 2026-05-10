# Catering Marketplace (CAT)

Modern web platform to discover, compare, chat with, and book catering vendors for events.

## Monorepo

- `apps/web`: Next.js (customer + vendor + admin UI)
- `apps/api`: Express API (auth, vendors, bookings, payments, chat)

## Local dev

Install dependencies (from repo root):

```bash
npm install
```

Run MongoDB locally (or point `MONGODB_URI` at Atlas). Example local URI:

`mongodb://127.0.0.1:27017/cat`

Copy env examples:

- `apps/api/.env.example` → `apps/api/.env`
- `apps/web/.env.local.example` → `apps/web/.env.local`

Run web + api together:

```bash
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000` — health: `GET /health`

### Auth API (Milestone 2)

- `POST /auth/register` — body: `{ email, password, name, role?: "customer"|"vendor"|"admin" }` (admin only if `ALLOW_ADMIN_REGISTER=true`)
- `POST /auth/login`
- `GET /auth/me` — header: `Authorization: Bearer <token>`
- `GET /admin/ping` — admin JWT only

## Environment variables

Each app has its own env file:

- `apps/web/.env.local`
- `apps/api/.env`

