# FinManage Backend (Fastify + Prisma)

This is the backend service for the FinManage application, built with a focus on performance, security, and clean architecture.

## 🚀 Tech Stack & Techniques

- **Framework**: [Fastify](https://www.fastify.io/) (High-performance web framework for Node.js)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Caching**: Redis (via `ioredis`)
- **Validation**: Zod + `fastify-type-provider-zod`
- **Security & Authentication**:
  - `bcryptjs` for password hashing (Cost: 12)
  - Short-lived Access Tokens (15m) + Long-lived Refresh Tokens (7d)
  - Hashed Refresh Token rotation in DB for enhanced security
  - JWT integration via `@fastify/jwt`
- **Rate Limiting** (`@fastify/rate-limit` + Redis):
  - Global rate limit: `100 requests / 1 minute`
  - Strict Auth rate limit (Login/Register): `5-10 requests / 15 minutes` (Brute-force protection)
- **Advanced Caching Strategy**:
  - `TTL 2 mins`: Transaction Lists (highly volatile)
  - `TTL 5 mins`: Budgets, Goals, User Profile
  - `TTL 10 mins`: Analytical Reports, Category Lists
  - Automatic cache invalidation on write (Create/Update/Delete)
- **Architecture**: Layered design (Route → Controller → Service → Schema/Model)

## 📁 Project Structure

```text
src/
├── config/        # Environment variables validation (Zod)
├── hooks/         # Fastify lifecycle hooks (e.g., authenticate)
├── modules/       # Feature modules (auth, budgets, categories, goals, reports, transactions, users)
│   └── [module]/
│       ├── *.route.ts       # Route definitions & schema binding
│       ├── *.controller.ts  # Thin request/response handlers
│       ├── *.service.ts     # Core business logic & DB/Cache interaction
│       └── *.schema.ts      # Zod validation schemas
├── plugins/       # Fastify plugins (DB, Redis, Rate Limit)
├── types/         # TypeScript type augmentations
├── utils/         # Helpers (Cache manager, Password hasher, Error handler)
└── server.ts      # Application entry point
```

## 🛠️ Setup & Run

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for PostgreSQL & Redis)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Ensure your `.env` file matches the following structure:
```env
DATABASE_URL="postgresql://admin:password123@localhost:5432/finmanage?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### 4. Start Infrastructure (DB & Cache)
```bash
docker-compose up -d
```

### 5. Database Migration
Synchronize your Prisma schema with the PostgreSQL database:
```bash
npm run db:push
npm run db:generate
```

### 6. Start the Server
Start the development server with hot-reload:
```bash
npm run dev
```
The server will run at `http://localhost:5000`.

A complete `database.sql` file is provided in the root directory. It contains the full PostgreSQL schema, including triggers for `updatedAt` and sample seed data. You can execute this file directly against your PostgreSQL instance if you prefer not to use Prisma's migration tools.

## 🚀 Syncing Database to Production (Neon DB)

There are two primary ways to sync your Prisma schema to your remote database on Neon. You can run these commands directly in your terminal (PowerShell) from the `be` directory.

### Method 1: Using `db push` (For Development / Prototyping)
Best for rapid changes when you don't need migration history. Run the following step-by-step commands:

```powershell
# 1. Set the production Neon DB connection string
$env:DATABASE_URL="postgresql://neondb_owner:npg_Bpfv8zAre5sY@ep-floral-river-ap77dazb.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 2. Push the schema directly to the remote database
npx prisma db push

# 3. Generate the updated Prisma Client for your code
npx prisma generate

# 4. Revert the terminal environment variable back to local DB
$env:DATABASE_URL="postgresql://admin:password123@localhost:5432/finmanage?schema=public"
```

### Method 2: Using `migrate dev` (Best Practice for Production)
Best for when your app is live and you want to track schema changes via SQL files. Run the following step-by-step commands:

```powershell
# 1. Set the production Neon DB connection string
$env:DATABASE_URL="postgresql://neondb_owner:npg_Bpfv8zAre5sY@ep-floral-river-ap77dazb.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 2. Create and apply a new migration (replace 'remove_columns' with your description)
npx prisma migrate dev --name remove_columns

# 3. Generate the updated Prisma Client for your code
npx prisma generate

# 4. Revert the terminal environment variable back to local DB
$env:DATABASE_URL="postgresql://admin:password123@localhost:5432/finmanage?schema=public"
```
