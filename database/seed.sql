-- =========================
-- Genres
-- =========================
INSERT INTO genres (name) VALUES
  ('Action'),
  ('Comedy'),
  ('Drama'),
  ('Sci-Fi');

-- =========================
-- Movies
-- =========================
INSERT INTO movies (title, synopsis, duration_minutes, mpaa_rating, director, producer, poster_url, trailer_url, release_date)
VALUES
('Interstellar', 'A team of explorers travel through a wormhole in space...', 169, 'PG-13', 'Christopher Nolan', 'Emma Thomas',
 'https://example.com/interstellar.jpg', 'https://www.youtube.com/embed/zSWdZVtXT7E', '2014-11-07'),

('Inception', 'A thief who steals corporate secrets through dream-sharing...', 148, 'PG-13', 'Christopher Nolan', 'Emma Thomas',
 'https://example.com/inception.jpg', 'https://www.youtube.com/embed/YoHD9XEInc0', '2010-07-16'),

('The Dark Knight', 'Batman faces the Joker in Gotham City.', 152, 'PG-13', 'Christopher Nolan', 'Charles Roven',
 'https://example.com/dark_knight.jpg', 'https://www.youtube.com/embed/EXeTwQWrcwY', '2008-07-18');

-- =========================
-- Map Movies to Genres
-- =========================
INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = 'Interstellar';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = 'Inception';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Action') FROM movies WHERE title = 'The Dark Knight';

-- =========================
-- Halls
-- =========================
INSERT INTO halls (name, description) VALUES
  ('Main Hall', 'Primary auditorium with 200 seats');

-- =========================
-- Shows
-- =========================
INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-15 19:00:00', '2025-09-15 21:49:00'
FROM movies m, halls h
WHERE m.title = 'Interstellar' AND h.name = 'Main Hall';

INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-16 20:00:00', '2025-09-16 22:30:00'
FROM movies m, halls h
WHERE m.title = 'Inception' AND h.name = 'Main Hall';
