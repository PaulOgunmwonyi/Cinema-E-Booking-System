
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

--users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT FALSE,  
  is_admin BOOLEAN DEFAULT FALSE,
  promo_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- role rows 
INSERT INTO roles (name) 
  SELECT v FROM (VALUES('user'),('admin')) AS t(v);

INSERT INTO users (first_name, last_name, email, password_hash, is_admin, is_active)
VALUES ('Admin', 'User', 'admin@example.com', crypt('admin123', gen_salt('bf')), true, true);


-- Email confirmation tokens
CREATE TABLE email_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX  idx_email_confirmations_token ON email_confirmations(token);

-- Password reset tokens
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_password_resets_token ON password_resets(token);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  line1 TEXT,
  line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payment cards table 
CREATE TABLE payment_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_type VARCHAR(20),
  card_number_encrypted TEXT,
  expiration_date VARCHAR (10),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- index for lookups
CREATE INDEX idx_payment_cards_user_id ON payment_cards(user_id);

