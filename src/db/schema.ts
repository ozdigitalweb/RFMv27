import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  role: text('role').default('listener').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const songRequests = pgTable('song_requests', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'),
  listenerName: text('listener_name').notNull(),
  listenerCity: text('listener_city'),
  artist: text('artist').notNull(),
  songTitle: text('song_title').notNull(),
  dedicatedTo: text('dedicated_to'),
  message: text('message'),
  artworkUrl: text('artwork_url'),
  previewUrl: text('preview_url'),
  artistBio: text('artist_bio'),
  votes: integer('votes').default(1).notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'playing', 'played'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shoutouts = pgTable('shoutouts', {
  id: serial('id').primaryKey(),
  userId: text('user_uid'),
  authorName: text('author_name').notNull(),
  authorCity: text('author_city'),
  avatarUrl: text('avatar_url'),
  content: text('content').notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schedule = pgTable('schedule', {
  id: serial('id').primaryKey(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday, -1 = all
  title: text('title').notNull(),
  host: text('host').notNull(),
  hostRole: text('host_role'),
  hostAccountId: text('host_account_id'),
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(), // HH:MM
  hasReprise: boolean('has_reprise').default(false),
  isActive: boolean('is_active').default(true),
  repriseDayOfWeek: integer('reprise_day_of_week'),
  repriseStartTime: text('reprise_start_time'),
  repriseEndTime: text('reprise_end_time'),
  repriseDaysLabel: text('reprise_days_label'),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  bannerUrl: text('banner_url'),
  logoUrl: text('logo_url'),
  genre: text('genre'),
  daysLabel: text('days_label'),
  hostBio: text('host_bio'),
  instagramHandle: text('instagram_handle'),
  whatsappNumber: text('whatsapp_number'),
  highlightsJson: text('highlights_json'),
  playlistJson: text('playlist_json'),
  photoGalleryJson: text('photo_gallery_json'),
  videoGalleryJson: text('video_gallery_json'),
  mixcloudUser: text('mixcloud_user'),
  mixcloudUrl: text('mixcloud_url'),
  seedKey: text('seed_key').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stationSettings = pgTable('station_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pageSeo = pgTable('page_seo', {
  id: serial('id').primaryKey(),
  path: text('path').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  keywords: text('keywords').default(''),
  canonicalUrl: text('canonical_url').default(''),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  ogType: text('og_type').default('website'),
  twitterCard: text('twitter_card').default('summary_large_image'),
  geoRegion: text('geo_region').default('BR-RS'),
  geoPlacename: text('geo_placename').default('Canoas, Rio Grande do Sul, Brasil'),
  geoPosition: text('geo_position').default('-29.9189;-51.1794'),
  icbm: text('icbm').default('-29.9189, -51.1794'),
  schemaType: text('schema_type').default('RadioStation'),
  jsonLdCustom: text('json_ld_custom'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

