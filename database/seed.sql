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
 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg', 'https://www.youtube.com/embed/zSWdZVtXT7E', '2014-11-07'),

('Inception', 'A thief who steals corporate secrets through dream-sharing...', 148, 'PG-13', 'Christopher Nolan', 'Emma Thomas',
 'https://m.media-amazon.com/images/I/81p+xe8cbnL._UF894,1000_QL80_.jpg', 'https://www.youtube.com/embed/YoHD9XEInc0', '2010-07-16'),

('The Dark Knight', 'Batman faces the Joker in Gotham City.', 152, 'PG-13', 'Christopher Nolan', 'Charles Roven',
 'https://m.media-amazon.com/images/S/pv-target-images/e9a43e647b2ca70e75a3c0af046c4dfdcd712380889779cbdc2c57d94ab63902.jpg', 'https://www.youtube.com/embed/EXeTwQWrcwY', '2008-07-18'),

 ('The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 142, 'R', 'Frank Darabont', 'Niki Marvin',
 'https://cdn.posteritati.com/posters/000/000/040/611/the-shawshank-redemption-md-web.jpg', 'https://www.youtube.com/embed/NmzuHjWmXOc', '1994-09-23'),

('Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 154, 'R', 'Quentin Tarantino', 'Lawrence Bender',
 'https://www.limitedruns.com/media/cache/aa/15/aa159c86c45999a6b4cf14d257837181.jpg', 'https://www.youtube.com/embed/s7EdQ4FqbhY', '1994-10-14'),

 ('65', 'After a catastrophic crash on a planet, a pilot Mills discovers he’s stranded on Earth 65 million years ago; with only one chance at rescue, Mills and young survivor Koa must traverse dangerous terrain populated by prehistoric beasts.', 93, 'PG-13', 'Scott Beck & Bryan Woods', 'Sam Raimi / Deborah Liebling / Zainab Azizi / Scott Beck / Bryan Woods', 'https://ih1.redbubble.net/image.4850076747.4621/flat,750x,075,f-pad,750x1000,f8f8f8.jpg', 'https://www.youtube.com/embed/bHXejJq5vr0', '2023-03-10'),

('John Wick: Chapter 4', 'John Wick uncovers a path to defeating The High Table. Before he can earn his freedom, he must face powerful enemies across the globe and old friends turn into foes.', 169, 'R', 'Chad Stahelski', 'Basil Iwanyk / Erica Lee / Chad Stahelski', 'https://i.ebayimg.com/images/g/bogAAOSwzNFmZrBF/s-l400.jpg', 'https://www.youtube.com/embed/qEVUtrk8_B4', '2023-03-24'),

('Godzilla Minus One', 'In post-war Japan, an already devastated country must confront a new crisis when Godzilla emerges again, bringing massive destruction and despair.', 125, 'PG-13', 'Takashi Yamazaki', 'Toho Studios / Robot Communications', 'https://i.ebayimg.com/images/g/OFwAAOSwieFmHA7e/s-l400.jpg', 'https://www.youtube.com/embed/nAYKaslCXPc', '2023-12-01'),

('Ghosted', 'A romantic action comedy in which a secret spy and a reluctant adventurer are forced to team up when their relationship is revealed to have been built on lies and hidden agendas.', 116, 'PG-13', 'Dexter Fletcher', 'David Ellison / Dana Goldberg / Don Granger / Chris Evans / Jules Daly', 'https://i.etsystatic.com/56874794/r/il/b50d46/6895130083/il_570xN.6895130083_9p5p.jpg', 'https://www.youtube.com/embed/IAdCsNtEuBU', '2023-04-21'),

('Heart of Stone', 'When a mysterious and powerful AI system known as "The Heart" is endangered, global intelligence operative Rachel must embark on a dangerous mission to protect it from falling into wrong hands.', 122, 'PG-13', 'Tom Harper', 'Gal Gadot / Jamie Dornan / Alia Bhatt / Skydance etc.', 'https://filmfare.wwmindia.com/content/2023/jul/heartofstonealiabhatt11689673722.jpg', 'https://www.youtube.com/embed/XuDwndGaCFo', '2023-08-11'),

('Robots', 'A sci-fi romantic comedy based on a short story where an ordinary human falls in love with a humanoid robot, confronting prejudice, identity, and what it means to be alive.', 93, 'PG-13', 'Ant Hines & Casper Christensen', 'Ant Hines / Casper Christensen etc.', 'https://images.static-bluray.com/movies/dvdcovers/276081_medium.jpg', 'https://www.youtube.com/embed/fI53zc6ohk4', '2023-05-19'),

('Dungeons & Dragons: Honor Among Thieves', 'A charming thief and a band of unlikely adventurers embark on a quest to recover a lost relic, but things go dangerously awry when they cross powerful enemies.', 134, 'PG-13', 'John Francis Daley & Jonathan Goldstein', 'Jeremy Latcham / etc.', 'https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fpipbhmro534a1.jpg', 'https://www.youtube.com/embed/37K6Fpnxv3g', '2023-03-31'),

('Blue Beetle', 'A young man discovers he has superpowers when an alien scarab grafts itself to his spine, giving him armor and capabilities far beyond ordinary; he must learn to use them to protect those he loves.', 120, 'PG-13', 'Angel Manuel Soto', 'Hiram Garcia / etc.', 'https://m.media-amazon.com/images/I/81l3eqG5-oL._UF894,1000_QL80_.jpg', 'https://www.youtube.com/embed/vS3_72Gb-bI', '2023-08-18'),

('No Hard Feelings', 'When a wealthy couple hires a young woman to date their introverted son before college to help boost his confidence, comedic chaos ensues as romance, expectations, and misunderstandings collide.', 111, 'R', 'Gene Stupnitsky', 'Good Universe etc.', 'https://pbs.twimg.com/media/FxJZVHvXsAI2vmE.jpg', 'https://www.youtube.com/embed/P15S6ND8kbQ', '2023-06-23');

-- =========================
-- Map Movies to Genres
-- =========================
INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = 'Interstellar';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = 'Inception';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Action') FROM movies WHERE title = 'The Dark Knight';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = '65';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Action') FROM movies WHERE title = 'John Wick: Chapter 4';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Action') FROM movies WHERE title = 'Godzilla Minus One';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Comedy') FROM movies WHERE title = 'Ghosted';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Action') FROM movies WHERE title = 'Heart of Stone';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = 'Robots';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Comedy') FROM movies WHERE title = 'Partner';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Action') FROM movies WHERE title = 'Dungeons & Dragons: Honor Among Thieves';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Sci-Fi') FROM movies WHERE title = 'Blue Beetle';

INSERT INTO movie_genres_map (movie_id, genre_id)
SELECT id, (SELECT id FROM genres WHERE name = 'Comedy') FROM movies WHERE title = 'No Hard Feelings';


-- =========================
-- Halls
-- =========================
INSERT INTO halls (name, description) VALUES
  ('Main Hall', 'Primary auditorium with 200 seats');

-- =========================
-- Shows
-- =========================

-- Already showing
INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-15 19:00:00', '2025-09-18 18:00:00','2025-09-20 15:00:00', '2025-09-23 21:00:00'
FROM movies m, halls h
WHERE m.title = 'Interstellar' AND h.name = 'Main Hall';

INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-18 18:00:00', '2025-09-20 15:00:00', '2025-09-17 20:00:00', '2025-09-23 21:00:00'
FROM movies m, halls h
WHERE m.title = 'Inception' AND h.name = 'Main Hall';

INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-18 18:00:00', '2025-09-20 15:00:00', '2025-09-23 21:00:00', '2025-09-23 19:30:00'
FROM movies m, halls h
WHERE m.title = 'Ghosted' AND h.name = 'Main Hall';

INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-18 18:00:00', '2025-09-20 15:00:00', '2025-09-23 21:00:00', '2025-09-25 20:00:00'
FROM movies m, halls h
WHERE m.title = 'Heart of Stone' AND h.name = 'Main Hall';

INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-18 18:00:00', '2025-09-20 15:00:00', '2025-09-22 18:30:00','2025-09-23 21:00:00'
FROM movies m, halls h
WHERE m.title = 'Godzilla Minus One' AND h.name = 'Main Hall';

INSERT INTO shows (movie_id, hall_id, start_time, end_time)
SELECT m.id, h.id, '2025-09-18 18:00:00', '2025-09-20 15:00:00', '2025-09-22 20:00:00', '2025-09-23 21:00:00'
FROM movies m, halls h
WHERE m.title = 'John Wick: Chapter 4' AND h.name = 'Main Hall';



