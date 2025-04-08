import { pgTable, text, serial, numeric, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const animeTypeEnum = pgEnum('anime_type', ['TV', 'Movie', 'OVA', 'Special']);
export const animeStatusEnum = pgEnum('anime_status', ['Ongoing', 'Completed', 'Upcoming']);
export const userRoleEnum = pgEnum('user_role', ['User', 'Manager', 'Admin']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'Blocked']);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('User'),
  status: userStatusEnum("status").notNull().default('Active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  avatar: text("avatar"),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: text("ip_address").notNull(),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActive: timestamp("last_active").notNull().defaultNow(),
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const animes = pgTable("animes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: animeTypeEnum("type").notNull(),
  status: animeStatusEnum("status").notNull(),
  releaseYear: integer("release_year").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  duration: text("duration"),
  coverImage: text("cover_image"),
  bannerImage: text("banner_image"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const animeGenres = pgTable("anime_genres", {
  id: serial("id").primaryKey(),
  animeId: integer("anime_id").notNull().references(() => animes.id, { onDelete: 'cascade' }),
  genreId: integer("genre_id").notNull().references(() => genres.id, { onDelete: 'cascade' }),
});

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  animeId: integer("anime_id").notNull().references(() => animes.id, { onDelete: 'cascade' }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration").notNull(),
  thumbnail: text("thumbnail"),
});

export const videoSources = pgTable("video_sources", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  quality: text("quality").notNull(),
  url: text("url").notNull(),
  isDownloadable: boolean("is_downloadable").notNull().default(false),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  animeId: integer("anime_id").notNull().references(() => animes.id, { onDelete: 'cascade' }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  animeId: integer("anime_id").notNull().references(() => animes.id, { onDelete: 'cascade' }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const watchProgress = pgTable("watch_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  episodeId: integer("episode_id").notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  progress: integer("progress").notNull().default(0), // in seconds
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  episodeId: integer("episode_id").notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  quality: text("quality").notNull(),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  completed: boolean("completed").notNull().default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  watchlist: many(watchlist),
  favorites: many(favorites),
  watchProgress: many(watchProgress),
  downloads: many(downloads),
}));

export const animesRelations = relations(animes, ({ many }) => ({
  genres: many(animeGenres),
  seasons: many(seasons),
  watchlist: many(watchlist),
  favorites: many(favorites),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  anime: one(animes, {
    fields: [seasons.animeId],
    references: [animes.id],
  }),
  episodes: many(episodes),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  season: one(seasons, {
    fields: [episodes.seasonId],
    references: [seasons.id],
  }),
  videoSources: many(videoSources),
  watchProgress: many(watchProgress),
  downloads: many(downloads),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  animes: many(animeGenres),
}));

export const animeGenresRelations = relations(animeGenres, ({ one }) => ({
  anime: one(animes, {
    fields: [animeGenres.animeId],
    references: [animes.id],
  }),
  genre: one(genres, {
    fields: [animeGenres.genreId],
    references: [genres.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, role: true, status: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const insertAnimeSchema = createInsertSchema(animes)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    genres: z.array(z.number()),
  });

export const insertSeasonSchema = createInsertSchema(seasons).omit({ id: true });

export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true });

export const insertVideoSourceSchema = createInsertSchema(videoSources).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Anime = typeof animes.$inferSelect & { genres?: { id: number, name: string }[] };
export type InsertAnime = z.infer<typeof insertAnimeSchema>;

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;

export type VideoSource = typeof videoSources.$inferSelect;
export type InsertVideoSource = z.infer<typeof insertVideoSourceSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type AnimeGenre = typeof animeGenres.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type WatchProgress = typeof watchProgress.$inferSelect;
export type Download = typeof downloads.$inferSelect;
