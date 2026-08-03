-- Migration 004: Add equipment field to routine_exercises

ALTER TABLE routine_exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT;
