# Gen‑Zuni Backend

Backend API for **Gen‑Zuni**, a 1‑on‑1 online class / tutoring marketplace. It manages
users, teacher profiles & onboarding, a wallet with manual recharge and **escrow**
payments, support tickets, and a full **session booking** flow (free trial → paid
sessions with deferred payment release).

Built with **NestJS 11**, **TypeORM**, and **MySQL**.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Running the app](#running-the-app)
- [API overview](#api-overview)
- [Authentication & roles](#authentication--roles)
- [Modules & endpoints](#modules--endpoints)
- [Domain flows](#domain-flows)
- [Database & entities](#database--entities)
- [Conventions](#conventions)
- [Testing](#testing)
- [Known issues / hardening TODO](#known-issues--hardening-todo)

---

## Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Node.js |
| Framework | NestJS 11 (`@nestjs/*`) |
| ORM | TypeORM 0.3 (`mysql2` driver) |
| Database | MySQL |
| Auth | Passport JWT (`@nestjs/jwt`, `passport-jwt`), `bcrypt` password hashing |
| Validation | `class-validator` + `class-transformer` (global `ValidationPipe`) |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Logging | Winston (`nest-winston`) |
| HTTP client | `axios` (e.g. payment gateway calls) |

---

## Features

- **Authentication** — email/password login, signup with email‑code verification, JWT
  (7‑day expiry), and an admin "login as user" capability.
- **Role‑based access** — `admin`, `teacher`, `student` enforced via guards.
- **Users** — CRUD, role filtering, search, balance management, statistics.
- **Teachers** — teacher profiles (price, session duration, level, category, locations)
  and an onboarding **request/review** workflow.
- **Categories & locations** — teacher categorisation and per‑location data.
- **Wallet** — manual bank‑card recharge with admin approval, transaction history,
  balance summary, and **escrow** (`hold` / `release` / `refund`) for session payments.
- **Session booking** — teacher weekly availability, bookable‑slot generation, one free
  **trial** per teacher, **paid** bookings (weekly recurrence) gated behind a completed
  trial, and **deferred payment release** to the teacher on session completion.
- **Support tickets** — tickets with threaded messages and read status.
- **Orders / payments** — order flow with an online payment gateway (Zarinpal) integration.
- **Notifications** — shared notification service.
- **Localization** — language is a URL prefix (`/english`, `/persian`).

---

## Project structure

```
src/
├── app.module.ts            # Root module: wires all feature modules + TypeORM
├── main.ts                  # Bootstrap: global prefix, ValidationPipe, CORS, Swagger
├── auth/                    # Login/signup, JWT strategy, guards, @Roles decorator
├── users/                   # User CRUD, roles, balance, search, stats
├── teacher/                 # Teacher profiles + categories (+ empty ClassService stub)
├── teacher-requests/        # Teacher onboarding applications & review
├── wallet/                  # Wallet, recharge, transactions, escrow (see wallet/README.md)
├── booking/                 # Session booking + escrow release (see booking/README.md)
├── ticket/                  # Support tickets & messages
├── order/                   # Orders + online payment gateway
├── notification/            # Notification service
├── translate/              # Localization
├── common/                  # Shared enums (Role, ELanguage), decorators, helpers
├── config/                  # Swagger setup
└── entity/                  # All TypeORM entities (centralized)
```

Feature modules follow a consistent layout: `*.module.ts`, `*.controller.ts`,
`*.service.ts`, and a `dto/` folder. **Entities are centralized in `src/entity/`** (not
per‑module). Several modules ship their own deep‑dive README (`src/wallet/README.md`,
`src/booking/README.md`).

---

## Getting started

### Prerequisites

- Node.js (LTS recommended)
- A reachable **MySQL** database
- npm

### Installation

```bash
npm install
```

### Database

The app uses TypeORM with **`synchronize: true`** and `autoLoadEntities: true`, so the
schema is created/updated automatically from the entities on boot — no migrations.

> ⚠️ **`synchronize: true` mutates the connected database on every startup.** Point it at
> a dedicated dev/staging database while developing. See
> [Known issues](#known-issues--hardening-todo).

---

## Configuration

Configuration is loaded via `@nestjs/config` (`ConfigModule`, global) from a `.env` file
at the project root (`.env` is git‑ignored — create your own).

### Environment variables

| Variable | Used by | Description | Default |
| --- | --- | --- | --- |
| `PORT` | `src/main.ts` | HTTP port to listen on | `3002` |
| `BANK_CARD_NUMBER` | `src/wallet/wallet.service.ts` | Destination card shown for manual wallet recharges | `6037-9911-1234-5678` |

Example `.env`:

```dotenv
PORT=3002
BANK_CARD_NUMBER=0000-0000-0000-0000
```

### Configuration that currently lives in code (should be externalized)

- **Database connection** is hardcoded in `src/app.module.ts` (`TypeOrmModule.forRootAsync`)
  — host, port, username, password, and database name. Move these to env vars before
  any real deployment.
- **JWT secret** is hardcoded to `"test"` with a 7‑day expiry in `src/auth/auth.module.ts`
  and `src/auth/jwt.strategy.ts` (the `JWT_SECRET` wiring is present but commented out).
  Replace with a strong secret from the environment.

---

## Running the app

```bash
# development
npm run start

# watch mode (auto-reload)
npm run start:dev

# debug
npm run start:debug

# production (after `npm run build`)
npm run build
npm run start:prod
```

By default the server listens on **`http://localhost:3002`**.

---

## API overview

- **Language prefix (required):** a global prefix `/:lang` is applied to every route, so
  all paths start with a language segment — e.g. `/english/...` or `/persian/...`
  (`ELanguage`: `english`, `persian`).
- **Base URL example:** `http://localhost:3002/english`
- **Swagger UI:** `http://localhost:3002/api` — the **authoritative, always‑current**
  endpoint reference. Click **Authorize** and paste a JWT (`Bearer` is added for you;
  authorization persists across reloads).
- **Validation:** the global `ValidationPipe` runs with `whitelist`,
  `forbidNonWhitelisted`, and `transform` — unknown body fields are rejected and payloads
  are coerced to their DTO types.
- **CORS:** enabled for all origins.

---

## Authentication & roles

Authentication is **JWT bearer**. Obtain a token from `POST /:lang/auth/login`, then send
it as `Authorization: Bearer <token>` on protected routes.

**Roles** (`src/common/enums/role.enum.ts`): `admin`, `teacher`, `student`.

Guards & decorators:

- `JwtAuthGuard` (`src/auth/jwt-auth.guard.ts`) — requires a valid JWT.
- `RolesGuard` (`src/auth/roles.guard.ts`) + `@Roles(...)` (`src/auth/roles.detector.ts`) —
  restricts a route to specific roles. With no `@Roles`, any authenticated user passes.
- The current user is available on the request as `req.user` (`{ id, email, role }`).

### Auth endpoints (`/:lang/auth`)

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Login with email + password → JWT |
| POST | `/auth/signup` | public | Register; triggers email verification code |
| POST | `/auth/Acceptsignup/:email/:code` | public | Confirm signup with the emailed code |
| GET | `/auth/me` | authenticated | Current user from the token |
| POST | `/auth/as/:id` | admin | Issue a token impersonating another user |

---

## Modules & endpoints

> The lists below are representative. For the complete, guaranteed‑accurate set (request
> bodies, query params, responses), use **Swagger at `/api`**. All paths are under the
> `/:lang` prefix.

### Users (`/:lang/users`)

| Method | Path | Access |
| --- | --- | --- |
| POST | `/users` | public/admin |
| GET | `/users` | admin |
| GET | `/users/teachers` · `/users/students` | authenticated |
| GET | `/users/search?q=` · `/users/statistics` | admin |
| GET | `/users/profile/:id` | authenticated |
| PATCH | `/users/:id` · `/users/:id/balance` | admin |
| DELETE | `/users/:id` | admin |

### Teachers & categories (`/:lang/teachers`, `/:lang/categories`)

| Method | Path | Access |
| --- | --- | --- |
| PATCH | `/teachers/add/:id` | admin (promote a user to teacher) |
| GET | `/teachers/all` | authenticated (filter by search/lang/category) |
| GET | `/teachers/me` | teacher |
| GET | `/teachers/detail/:id` | admin |
| PUT | `/teachers/update/:id` | teacher/admin |
| DELETE | `/teachers/:id` | admin |
| POST/GET/PUT/DELETE | `/categories` (+ `/:id`) | admin/authenticated |
| PATCH | `/categories/teacher/:catId/:teacherId` | admin |

### Teacher requests (`/:lang/teacher-requests`)

Onboarding applications: `POST /teacher-requests`, `GET /teacher-requests`,
`GET /teacher-requests/stats`, `GET /teacher-requests/:id`,
`PUT /teacher-requests/:id/status`, `PUT /teacher-requests/:id/review`,
`DELETE /teacher-requests/:id`.

### Wallet (`/:lang/wallet`, admin under `/:lang/admin`)

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/wallet/recharge` | user | Create a pending recharge; returns bank card |
| PATCH | `/wallet/recharge/:id/confirm` | user | Mark "I paid" |
| GET | `/wallet/transactions` | user | Paginated history |
| GET | `/wallet/summary` | user | Balance + totals |
| GET | `/admin/transactions/pending` | admin | Confirmed‑but‑unapproved recharges |
| POST | `/admin/transactions/:id/approve` · `/reject` | admin | Approve/reject (applies balance) |
| POST | `/admin/wallet/deduct` | admin | Debit a wallet for a class |

See **[`src/wallet/README.md`](src/wallet/README.md)** for the full money model.

### Booking (`/:lang/teacher`, `/:lang/student`, `/:lang/admin/sessions`)

| Method | Path | Access |
| --- | --- | --- |
| POST/GET | `/teacher/availability` | teacher |
| DELETE | `/teacher/availability/:id` | teacher |
| GET | `/teacher/:id/available-slots` | authenticated |
| POST | `/student/trial-book` | student |
| POST | `/student/paid-book` | student |
| GET | `/student/sessions` | student |
| GET | `/teacher/sessions` | teacher |
| PATCH | `/teacher/sessions/:id/complete` | teacher |
| PATCH | `/admin/sessions/:id/resolve` | admin |

See **[`src/booking/README.md`](src/booking/README.md)** for the full booking + escrow flow.

### Tickets (`/:lang/tickets`)

`GET /tickets/my`, `POST /tickets`, `GET /tickets`, `GET /tickets/detail/:id`,
`PATCH /tickets/:id/status`, `POST /tickets/:id/messages`, `GET /tickets/:id/messages`.

### Orders, notifications, localization

- **Order** (`src/order/`) — order/checkout flow with an online payment gateway
  (Zarinpal); creates `payment` transactions. See Swagger for endpoints.
- **Notification** (`src/notification/`) — shared notification service used by other modules.
- **Translate** (`src/translate/`) — localization tied to the `/:lang` URL prefix.

---

## Domain flows

### Wallet recharge (manual bank transfer)

1. User `POST /wallet/recharge` → a **pending** transaction + the destination bank card.
2. User transfers money, then `PATCH /wallet/recharge/:id/confirm` (sets "user confirmed").
3. Admin `POST /admin/transactions/:id/approve` → balance is credited (atomic, locked).

### Session booking + escrow (deferred payment)

1. Teacher publishes weekly **availability**; students fetch **bookable slots**.
2. Student books **one free trial** per teacher (no money moves).
3. Teacher marks the trial **complete**, which **unlocks paid bookings**.
4. Student books N **paid** sessions (weekly/daily). The price is **debited immediately
   into escrow** (`held` transactions) — all sessions + holds created atomically.
5. When the teacher marks a paid session **complete**, the held payment is **released**:
   the hold becomes `accepted` and the teacher's wallet is credited.
6. Admins can **resolve** a held session by force‑releasing or refunding the student.

All booking wall‑clock times (availability windows, generated slots, day‑of‑week) are
interpreted in **UTC** for determinism.

---

## Database & entities

- **ORM:** TypeORM with `synchronize: true` + `autoLoadEntities: true` (schema auto‑managed,
  no migration files). All entities live in `src/entity/` and extend TypeORM `BaseEntity`.
- **IDs:** most entities use UUID primary keys; `Transaction` uses an auto‑increment int.
- Note: `Teacher` shares its primary key with `User` (a teacher's `id` **is** the user id).

| Entity (table) | Purpose |
| --- | --- |
| `User` (`users_gen`) | Accounts, role, hashed password, balance |
| `Wallet` (`wallet`) | Per‑user balance (source of truth for money) |
| `TransactionEntity` (`Transaction`) | Recharges, payments, escrow holds (`waiting`/`accepted`/`fail`/`held`) |
| `Teacher` (`teacher`) | Teacher profile: `price`, `minutePerSession`, level, category |
| `TeacherLocate` | Teacher locations |
| `Category` / `CategoryLocate` | Teacher categories & localized data |
| `TeacherRequest` (`teacher_requests`) | Teacher onboarding applications |
| `Session` (`session`) | A booked trial/paid lesson + escrow link |
| `TeacherAvailability` (`teacher_availability`) | Weekly availability windows |
| `SessionCompletionLog` (`session_completion_log`) | Completion / release audit trail |
| `Ticket` / `Message` / `MessageReadStatus` | Support tickets & threaded messages |
| `Order` | Orders / online payments |

---

## Conventions

- **DTOs** carry `class-validator` decorators and Swagger `@ApiProperty`; response DTOs
  often expose a static `fromEntity(...)` mapper. Decimal values are coerced with
  `Number(...)` (MySQL returns decimals as strings).
- **Money mutations** use a `QueryRunner` transaction with a `pessimistic_write` lock on
  the wallet row for atomicity (see `WalletService`).
- **Errors** use standard Nest exceptions (`BadRequestException`, `NotFoundException`,
  `ConflictException`, `ForbiddenException`).
- **Swagger** decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`)
  document every controller.

---

## Testing

```bash
npm run test        # unit tests (*.spec.ts)
npm run test:watch  # watch mode
npm run test:cov    # coverage
npm run test:e2e    # end-to-end
```

Lint & format:

```bash
npm run lint
npm run format
```

---

## Known issues / hardening TODO

- **Secrets in source:** the JWT secret (`"test"`) and the MySQL credentials are hardcoded
  (in `src/auth/*` and `src/app.module.ts`). Move them to environment variables and rotate
  before deployment.
- **`synchronize: true` in all environments:** convenient for development but risky for
  production — adopt migrations and disable auto‑sync for prod.
- **Shared/remote dev database:** the configured DB is remote and shared; starting the app
  applies schema changes to it. Prefer `npm run build` for quick verification when you
  don't intend to touch the schema.
- **TypeORM + MySQL enum diffing** can miss added enum values — after changing an enum,
  verify the live `COLUMN_TYPE` rather than trusting the sync log.

---

## License

UNLICENSED — private project.
