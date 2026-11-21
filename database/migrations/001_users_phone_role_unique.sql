-- Migration: allow one mobile number across TENANT + OWNER accounts (Rapido-style).
-- Fresh installs already get this from schema.sql. Run this only on databases
-- created with the old schema where users.phone had a UNIQUE index.
--
--   mysql -u root -p prent_db < database/migrations/001_users_phone_role_unique.sql
--
ALTER TABLE users DROP INDEX phone;
ALTER TABLE users ADD UNIQUE KEY uq_users_phone_role (phone, role);
