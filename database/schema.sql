
-- =========================
-- Movies Table
-- =========================
CREATE TABLE movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  synopsis TEXT,
  duration_minutes INT,
  mpaa_rating TEXT,
  release_date DATE,
  director TEXT,
  producer TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Genres Table
-- =========================
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- =========================
-- Movie <-> Genres Mapping
-- =========================
CREATE TABLE movie_genres_map (
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INT  REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- =========================
-- Halls Table
-- =========================
CREATE TABLE halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Shows Table
-- =========================
CREATE TABLE shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  hall_id uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_time > start_time)
);

-- =========================
-- Useful Indexes
-- =========================
CREATE INDEX idx_movies_title ON movies (title);

CREATE INDEX idx_shows_start_time ON shows (start_time);
