CREATE TABLE t_p79031975_stepmap_route_tracke.routes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance_m FLOAT NOT NULL DEFAULT 0,
  elapsed_sec INT NOT NULL DEFAULT 0,
  points JSONB NOT NULL DEFAULT '[]',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routes_user_date ON t_p79031975_stepmap_route_tracke.routes (user_id, date DESC);
