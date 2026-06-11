-- ============================================================
--  FinManage – PostgreSQL Database Schema
--  Generated: 2026-06-04
--  Compatible with: PostgreSQL 14+
-- ============================================================

-- ------------------------------------
-- Extensions
-- ------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------
-- Drop tables (safe order – child first)
-- ------------------------------------
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Budget"      CASCADE;
DROP TABLE IF EXISTS "Goal"        CASCADE;
DROP TABLE IF EXISTS "Category"    CASCADE;
DROP TABLE IF EXISTS "User"        CASCADE;

-- ============================================================
-- TABLE: User
-- ============================================================
CREATE TABLE "User" (
    "id"           TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "email"        TEXT         NOT NULL,
    "password"     TEXT         NOT NULL,      -- bcrypt hash (cost 12)
    "name"         TEXT,                        -- computed / display name
    "avatarUrl"    TEXT,
    "authProvider" TEXT         NOT NULL DEFAULT 'local', -- 'local' or 'google'
    "providerId"   TEXT,                        -- Firebase/Google user ID
    "refreshToken" TEXT,                        -- hashed refresh token (nullable)
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

COMMENT ON TABLE  "User"              IS 'Application users';
COMMENT ON COLUMN "User"."password"   IS 'bcrypt hash, never plain text';
COMMENT ON COLUMN "User"."refreshToken" IS 'Hashed JWT refresh token for rotation';

-- ============================================================
-- TABLE: Category
-- ============================================================
CREATE TABLE "Category" (
    "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name"      TEXT        NOT NULL,
    "type"      TEXT        NOT NULL,   -- CHECK: 'income' | 'expense'
    "color"     TEXT,                   -- hex color, e.g. '#7c5cfc'
    "icon"      TEXT,                   -- icon identifier, e.g. 'ShoppingCart'
    "userId"    TEXT        NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "Category_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "Category_type_check" CHECK ("type" IN ('income', 'expense')),
    CONSTRAINT "Category_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Category_userId_idx"      ON "Category"("userId");
CREATE INDEX "Category_userId_type_idx" ON "Category"("userId", "type");

COMMENT ON COLUMN "Category"."type"  IS 'income | expense';
COMMENT ON COLUMN "Category"."color" IS 'Hex color string e.g. #FF5733';

-- ============================================================
-- TABLE: Transaction
-- ============================================================
CREATE TABLE "Transaction" (
    "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "amount"      DOUBLE PRECISION NOT NULL,    -- must be positive (enforced in app)
    "type"        TEXT        NOT NULL,          -- 'income' | 'expense'
    "description" TEXT,
    "date"        TIMESTAMPTZ NOT NULL,
    "isRecurring" BOOLEAN     NOT NULL DEFAULT FALSE,
    "frequency"   TEXT,                          -- 'daily'|'weekly'|'monthly'|'yearly' (nullable)
    "userId"      TEXT        NOT NULL,
    "categoryId"  TEXT        NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "Transaction_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_type_check"     CHECK ("type" IN ('income', 'expense')),
    CONSTRAINT "Transaction_amount_check"   CHECK ("amount" > 0),
    CONSTRAINT "Transaction_frequency_check"
        CHECK ("frequency" IS NULL OR "frequency" IN ('daily', 'weekly', 'monthly', 'yearly')),
    CONSTRAINT "Transaction_userId_fkey"
        FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT
);

CREATE INDEX "Transaction_userId_idx"      ON "Transaction"("userId");
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date" DESC);
CREATE INDEX "Transaction_userId_type_idx" ON "Transaction"("userId", "type");
CREATE INDEX "Transaction_categoryId_idx"  ON "Transaction"("categoryId");
CREATE INDEX "Transaction_date_idx"        ON "Transaction"("date");

COMMENT ON COLUMN "Transaction"."amount"      IS 'Always positive; type field determines income/expense';
COMMENT ON COLUMN "Transaction"."isRecurring" IS 'Whether this is a recurring transaction';
COMMENT ON COLUMN "Transaction"."frequency"   IS 'daily | weekly | monthly | yearly (only if isRecurring=true)';

-- ============================================================
-- TABLE: Budget
-- ============================================================
CREATE TABLE "Budget" (
    "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "amount"     DOUBLE PRECISION NOT NULL,  -- budget limit for the period
    "period"     TEXT        NOT NULL,        -- format: 'YYYY-MM' e.g. '2026-06'
    "userId"     TEXT        NOT NULL,
    "categoryId" TEXT        NOT NULL,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "Budget_pkey"         PRIMARY KEY ("id"),
    CONSTRAINT "Budget_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "Budget_period_check" CHECK ("period" ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT "Budget_userId_fkey"
        FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE,
    CONSTRAINT "Budget_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE,
    CONSTRAINT "Budget_userId_categoryId_period_key"
        UNIQUE ("userId", "categoryId", "period")
);

CREATE INDEX "Budget_userId_idx"        ON "Budget"("userId");
CREATE INDEX "Budget_userId_period_idx" ON "Budget"("userId", "period");

COMMENT ON COLUMN "Budget"."period" IS 'Budget month in YYYY-MM format e.g. 2026-06';

-- ============================================================
-- TABLE: Goal
-- ============================================================
CREATE TABLE "Goal" (
    "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title"         TEXT        NOT NULL,
    "description"   TEXT,
    "targetAmount"  DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline"      TIMESTAMPTZ NOT NULL,
    "color"         TEXT,                   -- hex color for UI display
    "icon"          TEXT,                   -- icon identifier
    "userId"        TEXT        NOT NULL,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "Goal_pkey"                PRIMARY KEY ("id"),
    CONSTRAINT "Goal_targetAmount_check"  CHECK ("targetAmount" > 0),
    CONSTRAINT "Goal_currentAmount_check" CHECK ("currentAmount" >= 0),
    CONSTRAINT "Goal_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Goal_userId_idx"          ON "Goal"("userId");
CREATE INDEX "Goal_userId_deadline_idx" ON "Goal"("userId", "deadline");

COMMENT ON COLUMN "Goal"."currentAmount" IS 'Running total of contributions toward this goal';
COMMENT ON COLUMN "Goal"."deadline"      IS 'Target date to achieve the goal';

-- ============================================================
-- FUNCTION: auto-update updatedAt timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER "User_updatedAt"
    BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER "Category_updatedAt"
    BEFORE UPDATE ON "Category"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER "Transaction_updatedAt"
    BEFORE UPDATE ON "Transaction"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER "Budget_updatedAt"
    BEFORE UPDATE ON "Budget"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER "Goal_updatedAt"
    BEFORE UPDATE ON "Goal"
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- SEED DATA (optional, for development)
-- ============================================================

-- Demo user (password: "Demo@12345" hashed with bcrypt cost 12)
-- Run: node -e "const b=require('bcryptjs');b.hash('Demo@12345',12).then(h=>console.log(h))"
-- to regenerate the hash below
INSERT INTO "User" ("id", "email", "password", "name", "authProvider", "providerId")
VALUES (
    'usr_demo_001',
    'demo@finmanage.app',
    '$2a$12$demoHashPlaceholderReplaceWithRealBcryptHash00000000000000',
    'Demo User',
    'local',
    NULL
) ON CONFLICT ("email") DO NOTHING;

-- Default categories for the demo user
INSERT INTO "Category" ("id", "name", "type", "color", "icon", "userId") VALUES
    ('cat_income_salary',   'Salary',          'income',  '#10d9a0', 'Briefcase',     'usr_demo_001'),
    ('cat_income_freelance','Freelance',        'income',  '#7c5cfc', 'Code',          'usr_demo_001'),
    ('cat_income_invest',   'Investment',       'income',  '#38bdf8', 'TrendingUp',    'usr_demo_001'),
    ('cat_income_other',    'Other Income',     'income',  '#a78bfa', 'Plus',          'usr_demo_001'),
    ('cat_exp_food',        'Food & Dining',    'expense', '#f59e0b', 'UtensilsCrossed','usr_demo_001'),
    ('cat_exp_transport',   'Transportation',   'expense', '#10d9a0', 'Car',           'usr_demo_001'),
    ('cat_exp_shopping',    'Shopping',         'expense', '#ff4d6d', 'ShoppingCart',  'usr_demo_001'),
    ('cat_exp_entertain',   'Entertainment',    'expense', '#8b5cf6', 'Clapperboard',  'usr_demo_001'),
    ('cat_exp_health',      'Healthcare',       'expense', '#38bdf8', 'Heart',         'usr_demo_001'),
    ('cat_exp_utilities',   'Utilities',        'expense', '#71717a', 'Zap',           'usr_demo_001'),
    ('cat_exp_education',   'Education',        'expense', '#c084fc', 'BookOpen',      'usr_demo_001'),
    ('cat_exp_rent',        'Rent & Housing',   'expense', '#ef4444', 'Home',          'usr_demo_001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Monthly summary per user
CREATE OR REPLACE VIEW "v_monthly_summary" AS
SELECT
    t."userId",
    TO_CHAR(t."date", 'YYYY-MM')                          AS "period",
    SUM(CASE WHEN t."type" = 'income'  THEN t."amount" ELSE 0 END) AS "totalIncome",
    SUM(CASE WHEN t."type" = 'expense' THEN t."amount" ELSE 0 END) AS "totalExpense",
    SUM(CASE WHEN t."type" = 'income'  THEN t."amount" ELSE -t."amount" END) AS "netBalance"
FROM "Transaction" t
GROUP BY t."userId", TO_CHAR(t."date", 'YYYY-MM');

COMMENT ON VIEW "v_monthly_summary" IS 'Aggregated income/expense/balance per user per month';

-- Budget vs actual spending
CREATE OR REPLACE VIEW "v_budget_vs_actual" AS
SELECT
    b."id"         AS "budgetId",
    b."userId",
    b."categoryId",
    c."name"       AS "categoryName",
    c."color"      AS "categoryColor",
    c."icon"       AS "categoryIcon",
    b."period",
    b."amount"     AS "budgetAmount",
    COALESCE(SUM(t."amount"), 0) AS "spentAmount",
    b."amount" - COALESCE(SUM(t."amount"), 0) AS "remaining",
    CASE
        WHEN b."amount" = 0 THEN 0
        ELSE ROUND((COALESCE(SUM(t."amount"), 0) / b."amount" * 100)::NUMERIC, 2)
    END AS "percentUsed"
FROM "Budget" b
JOIN "Category" c ON c."id" = b."categoryId"
LEFT JOIN "Transaction" t
    ON t."categoryId" = b."categoryId"
    AND t."userId"    = b."userId"
    AND t."type"      = 'expense'
    AND TO_CHAR(t."date", 'YYYY-MM') = b."period"
GROUP BY b."id", b."userId", b."categoryId", c."name", c."color", c."icon", b."period", b."amount";

COMMENT ON VIEW "v_budget_vs_actual" IS 'Budget limits vs actual spending with percentage used';

-- Category breakdown (expense) per period
CREATE OR REPLACE VIEW "v_category_breakdown" AS
SELECT
    t."userId",
    TO_CHAR(t."date", 'YYYY-MM') AS "period",
    t."categoryId",
    c."name"   AS "categoryName",
    c."color"  AS "categoryColor",
    c."icon"   AS "categoryIcon",
    t."type",
    SUM(t."amount") AS "totalAmount",
    COUNT(*)        AS "transactionCount"
FROM "Transaction" t
JOIN "Category" c ON c."id" = t."categoryId"
GROUP BY t."userId", TO_CHAR(t."date", 'YYYY-MM'), t."categoryId", c."name", c."color", c."icon", t."type";

COMMENT ON VIEW "v_category_breakdown" IS 'Transaction totals grouped by category per month';
