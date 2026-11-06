CREATE TABLE IF NOT EXISTS run_attendance (
  id TEXT PRIMARY KEY,
  event_date TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  distance_km INTEGER NOT NULL CHECK (distance_km IN (3, 6)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_run_attendance_event_distance
  ON run_attendance(event_date, distance_km);
