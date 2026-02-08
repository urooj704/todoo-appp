-- Migration: Create tasks table
-- Date: 2026-02-05
-- Feature: Phase II Todo Web App

-- Better Auth manages the users table
-- This migration creates the application-managed tasks table

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    -- Ensure title is not empty
    CONSTRAINT chk_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Required indexes for query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Rollback migration (run manually if needed)
-- DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
-- DROP FUNCTION IF EXISTS update_updated_at();
-- DROP TABLE IF EXISTS tasks;
