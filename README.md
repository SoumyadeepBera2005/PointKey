# pRent — Find Your Place. Rent with Trust.

Full-stack implementation of the pRent specification (`../spect.md.md`): a privacy-gated,
AI-verified rental marketplace for Rooms, PGs and Flats.

## Stack

- **Frontend:** React (Vite, pure JS/.jsx), Tailwind CSS, Framer Motion, Lucide icons, Recharts
- **Backend:** Node.js + Express (pure .js), Socket.io, JWT, Razorpay, mysql2, ioredis
- **AI service:** Python FastAPI — DeepFace/MediaPipe face + liveness verification, LangChain NLP search
- **Data:** MySQL 8.0 (spatial `POINT SRID 4326`), Redis

## Layout

```
database/           schema.sql (full schema from spec §4 + chat_messages) & seed.sql
backend-node/       Express API gateway — auth, privacy guard, search, payments, visits, ratings, admin
ai-python-service/  FastAPI — /verify-owner-face, /ai-chatbot, /health
frontend-react/     Vite React app — auth, tenant, owner, admin screens
```

## Running the project

Two ways to run: **Option A (Docker)** — everything starts with one command; **Option B (local)** — run each service on your machine (MySQL + Redis still needed, installed or via Docker).

### Prerequisites

**Option A:** Docker + Docker Compose only.

**Option B:** Node.js 20+, Python 3.11+, MySQL 8.0 and Redis 7 running (or just the infra via Docker: `docker compose up -d mysql redis`).

### Option A — Docker (recommended)

```bash
cp .env.example .env   # fill in your keys (see "Environment keys" below)
docker compose up --build
```

- Frontend: http://localhost:5173 (nginx, proxies `/api`, `/uploads`, `/socket.io` to the backend)
- API: http://localhost:5000/api/v1/health
- AI service: http://localhost:8000/health
- MySQL and Redis ports are published on 3306 / 6379

First boot automatically applies `database/schema.sql` and `database/seed.sql` (mounted into the MySQL container's initdb). To wipe and re-seed from scratch:

```bash
docker compose down -v   # removes the prent_mysql_data volume — deletes all DB data
docker compose up --build
```

### Option B — Run locally (without Docker)

**1. Start MySQL 8 + Redis 7** — either local installs, or just the infra via Docker:

```bash
docker compose up -d mysql redis
```

**2. Load the database** (applies schema.sql + seed.sql; reuses `backend-node`'s node_modules, so install backend deps first):

```bash
cd backend-node
npm install
# IMPORTANT: do NOT copy .env.example over backend-node/.env — it will
# overwrite your real keys with placeholders (DB password becomes "rootpassword").
# Only if backend-node/.env does NOT exist yet, copy it: cp .env.example .env
# Then make sure DB_PASSWORD matches your local MySQL root password.
cd ..
node database/load.js
```

Expected output: `schema.sql applied successfully`, `seed.sql applied successfully`, then the list of `prent_db` tables and the 3 seeded users. Re-running is mostly safe — "duplicate entry / table already exists" errors can be ignored.

**3. Backend** (terminal 1):

```bash
cd backend-node
npm run dev     # node --watch src/server.js — auto-restarts on changes
# or: npm start
```

Health check: http://localhost:5000/api/v1/health → `{"status":"ok",...}`

**4. AI service** (terminal 2):

```bash
cd ai-python-service
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/health → `{"status":"ok","service":"prent-ai-service"}`

Notes: the heavy deps (`deepface`, `mediapipe`, `langchain`, `langchain-openai`) are commented out in `requirements.txt` — face match falls back to an explicit `FALLBACK_UNVERIFIED` score and the chatbot uses a deterministic NL→filter parser, so the app is fully demoable without them. Uncomment and `pip install` them in the venv if you want the real models.

**5. Frontend** (terminal 3):

```bash
cd frontend-react
npm install
npm run dev
```

Open http://localhost:5173

No frontend `.env` is needed for local dev — Vite proxies `/api`, `/uploads` and `/socket.io` to `http://localhost:5000` (see `vite.config.js`). Copy `.env.example` to `.env` only to override URLs or set `VITE_RAZORPAY_KEY_ID` / `VITE_GOOGLE_MAPS_KEY`.

### Verify it works

1. `curl http://localhost:5000/api/v1/health` and `curl http://localhost:8000/health` both return `ok`
2. Open http://localhost:5173 and log in with the demo credentials below (e.g. `tenant@prent.in` / `Tenant@123` — login is 2-step: password first, then an OTP is sent to the account's **email**; with no email provider configured the code is printed in the backend console / shown in the UI toast)
3. OTPs are printed to the backend console when no `EMAIL_PROVIDER_*` (login) or `SMS_PROVIDER_*` (legacy phone OTP) keys are configured

### Ports

| Service | Port | Notes |
| --- | --- | --- |
| Frontend | 5173 | Vite dev server (local) or nginx on 80 in Docker (published as 5173) |
| Backend API | 5000 | `/api/v1/*`, Socket.io on the same port |
| AI service | 8000 | FastAPI / uvicorn |
| MySQL | 3306 | |
| Redis | 6379 | |

### Troubleshooting

- **Backend can't connect to MySQL** — check MySQL is running and `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` in `backend-node/.env`. Local backend + Docker MySQL works out of the box (port 3306 is published).
- **Schema/seed errors on load** — re-running `node database/load.js` is safe; duplicate/exists errors are expected. For a fresh DB: `docker compose down -v` (Option A) or drop/recreate `prent_db` and re-run the loader.
- **Port already in use** — change `PORT` in `backend-node/.env` and update the proxy target in `frontend-react/vite.config.js` + `frontend-react/nginx.conf` accordingly.
- **Payments fail / no Razorpay keys** — with empty `RAZORPAY_KEY_ID` the backend runs in sandbox simulation mode (order created locally, marked SUCCESS).
- **`ER_ACCESS_DENIED_ERROR` from `database/load.js`** — the `DB_PASSWORD` in `backend-node/.env` doesn't match your local MySQL root password. If you ran `cp .env.example .env` and it already existed, your `.env` was overwritten with the placeholder `rootpassword` — set `DB_PASSWORD` to the real value and retry.
- **Never commit real keys** — `.env` is gitignored; keep `.env.example` free of real credentials.

## Environment keys

| Key | Used by | Notes |
| --- | --- | --- |
| `JWT_SECRET` | backend | long random string |
| `MYSQL_ROOT_PASSWORD` | mysql/backend | default `rootpassword` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | backend + frontend | if empty, payments run in **sandbox simulation mode** (order is created locally and marked SUCCESS) so the flow is fully demoable without keys |
| `VITE_RAZORPAY_KEY_ID` | frontend | public key id for Razorpay Checkout |
| `VITE_GOOGLE_MAPS_KEY` | frontend | Maps embed/pin; without it a Google Maps link is shown instead |
| `OPENAI_API_KEY` | ai-service | LangChain chatbot; without it, a deterministic NL→filter parser fallback is used |
| `EMAIL_SMTP_USER` / `EMAIL_SMTP_APP_PASSWORD` | backend | **Gmail** delivery of login OTPs (nodemailer). Requires 2FA on the Gmail account → Google Account → Security → 2-Step Verification → **App passwords** → generate one for "Mail". Optional `EMAIL_SMTP_HOST` / `EMAIL_SMTP_PORT` / `EMAIL_FROM` (defaults: smtp.gmail.com:465, from = SMTP user) |
| `EMAIL_PROVIDER_URL` / `EMAIL_PROVIDER_KEY` | backend | alternative: HTTP mail API (`POST { email, subject, message }` + Bearer key). If neither SMTP nor HTTP is configured, the OTP is logged to the backend console and echoed back as `dev_otp` so the 2-step login works offline |
| `SMS_PROVIDER_URL` / `SMS_PROVIDER_KEY` | backend | legacy phone OTP endpoints only — the login flow itself never verifies phone numbers |
| FastAPI face service | deepface + mediapipe | face match falls back to an explicit `FALLBACK_UNVERIFIED` score when models can't load, so the admin queue still works |

## Demo credentials (seed.sql)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@prent.in | `Admin@123` |
| Owner | owner@prent.in | `Owner@123` |
| Tenant | tenant@prent.in | `Tenant@123` |

All non-admin logins are 2-step: password first, then a 6-digit OTP sent to the account's email. The mobile number is stored but never verified — the backend only checks that the email ↔ mobile pair belongs to the same account. Login happens inside the auth popup on the role-selection screen (not a separate page).

## Implemented core flows

- Role-isolated auth (Tenant / Owner / Admin via MFA-style separate route), JWT guards. Public login is 2-step (password → email OTP). Forgot-password flow: „Forgot password?“ under the login form sends an OTP to the email attached to the account; verify it, set a new password, then log in (hook points: `authController.forgotPassword` / `resetPassword`) One mobile number can hold up to 2 accounts (TENANT + OWNER — Rapido-style); `users` enforces `UNIQUE(phone, role)`; emails stay globally unique
- Auth UI: login/signup open in an animated-background modal from the role-selection screen; "New user? Sign up" toggles signup mode
- Schema migration for pre-existing databases (old `users.phone UNIQUE`): `database/migrations/001_users_phone_role_unique.sql`
- Conditional search tree: Family → Rooms/Flat only; Male/Female → Student/Working Professional → PG/Rooms/Flat unlock
- Privacy-gated property details: exact address + owner contact masked until a SUCCESS payment exists (`privacyGuard.js`)
- 100% refund tracking, visit booking with fixed slot enums and per-property/date slot locking
- Admin-verified listings cannot be deleted by owners (admin delete only, with audit log)
- Owner AI face + Govt ID verification queue; two-way ratings; scam report queue
- Real-time tenant↔owner chat over Socket.io (persisted in `chat_messages`)

## Intentionally stubbed / next steps

- Login OTP is logged to the console unless `EMAIL_PROVIDER_*` keys are configured (hook point: `authController.deliverEmailOtp`); legacy phone OTP logged unless `SMS_PROVIDER_*` keys are configured (hook point: `authController.sendOtp`)
- Razorpay webhook signature verification is implemented; register the webhook URL in the Razorpay dashboard
- Google Maps: frontend uses an embed iframe when `VITE_GOOGLE_MAPS_KEY` is set, else an external maps link
- Admin analytics are live SQL aggregates; digital-marketing module is a placeholder screen
