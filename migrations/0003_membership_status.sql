CREATE TABLE IF NOT EXISTS membership_applications_status_migration (
  migration_guard INTEGER
);

ALTER TABLE membership_applications
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE membership_applications
  ADD COLUMN reviewed_at TEXT;
