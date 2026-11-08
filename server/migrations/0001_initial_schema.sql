-- Migração 0001: Esquema Base Inicial Idempotente (Rebeldia FM)
-- Compatível com PostgreSQL nativo via DATABASE_URL ou Cloud SQL

CREATE TABLE IF NOT EXISTS schema_migrations (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  applied_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  uid text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text,
  photo_url text,
  role text DEFAULT 'listener' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS song_requests (
  id serial PRIMARY KEY,
  user_uid text,
  listener_name text NOT NULL,
  listener_city text,
  artist text NOT NULL,
  song_title text NOT NULL,
  dedicated_to text,
  message text,
  artwork_url text,
  preview_url text,
  artist_bio text,
  votes integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shoutouts (
  id serial PRIMARY KEY,
  user_uid text,
  author_name text NOT NULL,
  author_city text,
  avatar_url text,
  content text NOT NULL,
  likes_count integer DEFAULT 0 NOT NULL,
  is_approved boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule (
  id serial PRIMARY KEY,
  day_of_week integer NOT NULL,
  title text NOT NULL,
  host text NOT NULL,
  host_role text,
  host_account_id text,
  start_time text NOT NULL,
  end_time text NOT NULL,
  has_reprise boolean DEFAULT false,
  is_active boolean DEFAULT true,
  reprise_day_of_week integer,
  reprise_start_time text,
  reprise_end_time text,
  reprise_days_label text,
  description text,
  avatar_url text,
  banner_url text,
  logo_url text,
  genre text,
  days_label text,
  host_bio text,
  instagram_handle text,
  whatsapp_number text,
  highlights_json text,
  playlist_json text,
  photo_gallery_json text,
  video_gallery_json text,
  mixcloud_user text,
  mixcloud_url text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS station_settings (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
