# Investment Portfolio API

Node.js + Express + PostgreSQL + Sequelize backend for tracking a personal investment portfolio (not a trading venue).

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or run `docker compose up -d` from this folder)

## Setup

1. Copy `.env.example` to `.env` and set strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` values.
2. Ensure `DATABASE_URL` points at your database (default matches `docker-compose.yml`).
3. For local development, keep `DB_SYNC=true` in `.env` so Sequelize can **create** tables on an empty database. Plain `sync()` does not add new columns to already-created tables; if models gain fields (e.g. password reset) and Postgres was created earlier, use **`npm run db:reset`** (or `docker compose down -v && docker compose up -d` from this folder) then restart the API — see **Fixing Sequelize schema mismatch** below. In production, set `DB_SYNC=false` and use migrations.
4. Install and start:

```bash
npm install
npm run dev
```

- API base: `http://localhost:4000/api`
- OpenAPI UI: `http://localhost:4000/api-docs`
- Health: `GET /health` (root) or `GET /api/health`

## Fixing Sequelize schema mismatch

**Why it happens:** The Sequelize `User` (and other) models define columns such as `password_reset_code`. If your PostgreSQL database was created from an older version of the app, those columns may not exist. Queries then fail with errors like `column "password_reset_code" does not exist`.

**What fixes it (development only):** `sequelize.sync()` creates tables when the database is **empty**, but it does **not** migrate existing tables to add new columns. The clean dev workflow is to reset the Docker volume so Postgres starts fresh, then let `sync()` recreate all tables from the current models.

1. Ensure `.env` has **`DB_SYNC=true`** (see `.env.example`).
2. From the **`backend/`** directory (where `docker-compose.yml` lives), stop Postgres and **remove its volume**:

   ```bash
   docker compose down -v
   ```

3. Start Postgres again:

   ```bash
   docker compose up -d
   ```

   Or use the shortcut:

   ```bash
   npm run db:reset
   ```

4. Start the API (`npm run dev`). On startup you should see a console warning that **DB_SYNC is enabled**; Sequelize will sync and create tables with every column the models define.

**Safety:** `docker compose down -v` **deletes all local database data** in that volume. Use this only in development. Never use volume wipes on production data; use proper migrations there instead.

## Email (optional)

If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` are missing or blank, verification and password-reset codes are **printed to the server console** (and a clear warning is logged) instead of being emailed.

### Gmail (recommended for development)

1. Enable **2-Step Verification** on the Google account.
2. Create an **App password** (Google Account → Security → App passwords) and put it in **`SMTP_PASS`** (16 characters, no spaces). Do **not** use your normal Gmail password.
3. In `.env`, set for example:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER` = your Gmail address
   - `SMTP_PASS` = the app password
   - `EMAIL_FROM` = same mailbox, e.g. `InvestPro <you@gmail.com>` (Gmail is strict about the sender matching the authenticated user).

On startup the API logs **SMTP CONFIG** (password only as `SET` / `MISSING`), runs **`transporter.verify()`**, and logs **`✅ SMTP READY`** or **`❌ SMTP ERROR`** with the full error object.

**Gmail:** The address in **`EMAIL_FROM`** must be the same mailbox as **`SMTP_USER`** (e.g. `InvestPro <you@gmail.com>` and `SMTP_USER=you@gmail.com`). Use a **16-character App Password** with **no spaces** in **`SMTP_PASS`** (paste errors often add spaces — the server strips them).

**SMTP test:** `POST /api/debug/send-test-email` with body `{ "email": "you@gmail.com" }` sends a test message (403 in production unless `ENABLE_DEBUG_EMAIL=true`). Check server logs for `SMTP READY` / `SMTP ERROR` and every `[email] attempt`.

## BVMT pricing

`services/bvmtService.js` attempts to scrape `BVMT_SCRAPE_URL` on a cron schedule (`BVMT_CRON`, default every 7 minutes). On failure, Tunisian tickers fall back to mock prices. Override mock data with `BVMT_MOCK_JSON` (JSON array of `{ ticker, name, category, price }`).

## Main HTTP routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/verify-email` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/refresh` | No |
| POST | `/api/debug/send-test-email` | No (dev / `ENABLE_DEBUG_EMAIL`) |
| GET | `/api/assets` | No |
| GET | `/api/assets/:ticker/history` | No |
| GET | `/api/portfolio` | Bearer JWT + verified email |
| GET | `/api/portfolio/performance` | Bearer JWT + verified email |
| GET | `/api/transactions` | Bearer JWT + verified email |
| POST | `/api/transactions/buy` | Bearer JWT + verified email |
| POST | `/api/transactions/sell` | Bearer JWT + verified email |
| POST | `/api/admin/assets` | Bearer JWT + verified + admin email |
| DELETE | `/api/admin/assets/:ticker` | Bearer JWT + verified + admin email |

Send `Authorization: Bearer <accessToken>` for protected routes.

## Security notes

- Passwords are hashed with bcrypt.
- Refresh tokens are stored hashed in PostgreSQL and rotated on use.
- Auth routes are rate-limited.
- Request bodies are validated with Joi.

The frontend in this repository is unchanged; point it at this API when you are ready to integrate.
