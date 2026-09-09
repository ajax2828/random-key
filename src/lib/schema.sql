-- =========================================
--  RandMail SQL Schema (PostgreSQL)
--  Replacement for Supabase managed database
-- =========================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------
-- users
--  (replaces Supabase auth.users + public.users profile)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email        TEXT UNIQUE NOT NULL,
    password     TEXT NOT NULL,           -- bcrypt hash
    full_name    TEXT,
    role         TEXT DEFAULT 'user',
    status       TEXT DEFAULT 'active',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------
-- generated_accounts  (from GeneratMail)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS generated_accounts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    password    TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_generated_accounts_user ON generated_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_accounts_created ON generated_accounts(created_at DESC);

-- -----------------------------------------
-- password_vault  (from GeneratPass)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS password_vault (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT,
    password    TEXT NOT NULL,
    length      INTEGER DEFAULT 18,
    strength    TEXT DEFAULT 'Sedang',
    use_upper   BOOLEAN DEFAULT TRUE,
    use_lower   BOOLEAN DEFAULT TRUE,
    use_numbers  BOOLEAN DEFAULT TRUE,
    use_symbols  BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_vault_user ON password_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_created ON password_vault(created_at DESC);

-- -----------------------------------------
-- form_profiles  (from GeneratPro)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS form_profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gender      TEXT NOT NULL DEFAULT 'Laki-laki',
    fullname    TEXT,
    email       TEXT,
    password    TEXT,
    phone       TEXT,
    birthdate   TEXT,
    username    TEXT,
    address     TEXT,
    job         TEXT,
    nik         TEXT,
    hobby       TEXT,
    education   TEXT,
    religion    TEXT,
    form_link   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_form_profiles_user ON form_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_form_profiles_created ON form_profiles(created_at DESC);

-- -----------------------------------------
-- sessions  (replaces Supabase auth sessions)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
