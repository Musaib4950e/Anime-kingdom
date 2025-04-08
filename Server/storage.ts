import { db, client, pool } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { 
  users, 
  animes, 
  seasons, 
  episodes, 
  videoSources, 
  genres, 
  animeGenres,
  userSessions,
  watchlist,
  favorites,
  watchProgress,
  downloads,
  type User, 
  type InsertUser,
  type Anime,
  type InsertAnime,
  type Season,
  type InsertSeason,
  type Episode,
  type InsertEpisode,
  type VideoSource,
  type InsertVideoSource,
  type UserSession,
  type Genre
} from "@shared/schema";



export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Anime methods
  getAnimes(): Promise<Anime[]>;
  getAnime(id: number): Promise<Anime | undefined>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  updateAnime(id: number, anime: Partial<InsertAnime>): Promise<Anime | undefined>;
  deleteAnime(id: number): Promise<boolean>;
  
  // Season methods
  getSeasons(animeId: number): Promise<Season[]>;
  getAllSeasons(): Promise<Season[]>;
  getSeason(id: number): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season | undefined>;
  deleteSeason(id: number): Promise<boolean>;
  
  // Episode methods
  getEpisodes(seasonId: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<boolean>;
  
  // Video Source methods
  getVideoSources(episodeId: number): Promise<VideoSource[]>;
  getVideoSource(id: number): Promise<VideoSource | undefined>;
  createVideoSource(source: InsertVideoSource): Promise<VideoSource>;
  updateVideoSource(id: number, source: Partial<InsertVideoSource>): Promise<VideoSource | undefined>;
  deleteVideoSource(id: number): Promise<boolean>;
  
  // Genre methods
  getGenres(): Promise<Genre[]>;
  
  // User Session methods
  getUserSessions(userId: number): Promise<UserSession[]>;
  createUserSession(userId: number, ipAddress: string, deviceInfo?: string): Promise<UserSession>;
  updateUserSessionActivity(id: number): Promise<UserSession | undefined>;
  deleteUserSession(id: number): Promise<boolean>;
  
  // Watchlist methods
  addToWatchlist(userId: number, animeId: number): Promise<void>;
  removeFromWatchlist(userId: number, animeId: number): Promise<void>;
  getWatchlist(userId: number): Promise<Anime[]>;
  
  // Favorites methods
  addToFavorites(userId: number, animeId: number): Promise<void>;
  removeFromFavorites(userId: number, animeId: number): Promise<void>;
  getFavorites(userId: number): Promise<Anime[]>;
  
  // Watch Progress methods
  updateWatchProgress(userId: number, episodeId: number, progress: number, completed: boolean): Promise<void>;
  getWatchProgress(userId: number, episodeId: number): Promise<number | undefined>;
  
  // Download methods
  recordDownload(userId: number, episodeId: number, quality: string, ipAddress?: string): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Use MemoryStore for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First delete related records
      // Delete from watchlist
      await db.delete(watchlist).where(eq(watchlist.userId, id));
      
      // Delete from favorites
      await db.delete(favorites).where(eq(favorites.userId, id));
      
      // Delete from watch progress
      await db.delete(watchProgress).where(eq(watchProgress.userId, id));
      
      // Delete from downloads
      await db.delete(downloads).where(eq(downloads.userId, id));
      
      // Delete from user sessions
      await db.delete(userSessions).where(eq(userSessions.userId, id));
      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Anime methods
  async getAnimes(): Promise<Anime[]> {
    try {
      console.log("Fetching all animes from database...");
      const allAnimes = await db.select().from(animes).orderBy(animes.title);
      console.log(`Successfully fetched ${allAnimes.length} animes`);
      
      // Fetch all anime-genre relationships
      const animeGenreRelationships = await db
        .select({
          animeId: animeGenres.animeId,
          genreId: animeGenres.genreId,
          genreName: genres.name
        })
        .from(animeGenres)
        .innerJoin(genres, eq(animeGenres.genreId, genres.id));
      
      // Group the relationships by animeId
      const animeGenreMap = new Map<number, { id: number, name: string }[]>();
      animeGenreRelationships.forEach(rel => {
        if (!animeGenreMap.has(rel.animeId)) {
          animeGenreMap.set(rel.animeId, []);
        }
        animeGenreMap.get(rel.animeId)!.push({ id: rel.genreId, name: rel.genreName });
      });
      
      // Add the genres to each anime
      const animesWithGenres = allAnimes.map(anime => {
        const animeGenres = animeGenreMap.get(anime.id) || [];
        return { ...anime, genres: animeGenres };
      });
      
      return animesWithGenres;
    } catch (error) {
      console.error("Error fetching animes:", error);
      throw error;
    }
  }

  async getAnime(id: number): Promise<Anime | undefined> {
    try {
      // Get the anime
      const animeResults = await db.select().from(animes).where(eq(animes.id, id));
      if (animeResults.length === 0) {
        return undefined;
      }
      
      const anime = animeResults[0];
      
      // Get the genres for this anime
      const genreResults = await db
        .select({
          id: genres.id,
          name: genres.name
        })
        .from(animeGenres)
        .innerJoin(genres, eq(animeGenres.genreId, genres.id))
        .where(eq(animeGenres.animeId, id));
      
      // Add the genres to the anime
      return { 
        ...anime, 
        genres: genreResults 
      };
    } catch (error) {
      console.error(`Error fetching anime with ID ${id}:`, error);
      throw error;
    }
  }

  async createAnime(anime: InsertAnime): Promise<Anime> {
    const { genres: genreIds, ...animeData } = anime;
    
    // Insert anime first
    const [createdAnime] = await db.insert(animes).values(animeData).returning();
    
    // Then associate genres if provided
    if (genreIds && genreIds.length > 0) {
      await Promise.all(
        genreIds.map(genreId => 
          db.insert(animeGenres).values({
            animeId: createdAnime.id,
            genreId
          })
        )
      );
    }
    
    return createdAnime;
  }

  async updateAnime(id: number, anime: Partial<InsertAnime>): Promise<Anime | undefined> {
    const { genres: genreIds, ...animeData } = anime;
    
    // Update anime data
    const [updatedAnime] = await db
      .update(animes)
      .set({ ...animeData, updatedAt: new Date() })
      .where(eq(animes.id, id))
      .returning();
    
    if (!updatedAnime) return undefined;
    
    // Update genres if provided
    if (genreIds) {
      // First remove existing associations
      await db.delete(animeGenres).where(eq(animeGenres.animeId, id));
      
      // Then add new ones
      if (genreIds.length > 0) {
        await Promise.all(
          genreIds.map(genreId => 
            db.insert(animeGenres).values({
              animeId: id,
              genreId
            })
          )
        );
      }
    }
    
    return updatedAnime;
  }

  async deleteAnime(id: number): Promise<boolean> {
    const result = await db.delete(animes).where(eq(animes.id, id)).returning({ id: animes.id });
    return result.length > 0;
  }

  // Season methods
  async getSeasons(animeId: number): Promise<Season[]> {
    return await db
      .select()
      .from(seasons)
      .where(eq(seasons.animeId, animeId))
      .orderBy(seasons.number);
  }
  
  async getAllSeasons(): Promise<Season[]> {
    return await db
      .select()
      .from(seasons)
      .orderBy(seasons.animeId, seasons.number);
  }

  async getSeason(id: number): Promise<Season | undefined> {
    const result = await db.select().from(seasons).where(eq(seasons.id, id));
    return result[0];
  }

  async createSeason(season: InsertSeason): Promise<Season> {
    const [result] = await db.insert(seasons).values(season).returning();
    return result;
  }

  async updateSeason(id: number, season: Partial<InsertSeason>): Promise<Season | undefined> {
    const [result] = await db
      .update(seasons)
      .set(season)
      .where(eq(seasons.id, id))
      .returning();
    return result;
  }

  async deleteSeason(id: number): Promise<boolean> {
    const result = await db.delete(seasons).where(eq(seasons.id, id)).returning({ id: seasons.id });
    return result.length > 0;
  }

  // Episode methods
  async getEpisodes(seasonId: number): Promise<Episode[]> {
    return await db
      .select()
      .from(episodes)
      .where(eq(episodes.seasonId, seasonId))
      .orderBy(episodes.number);
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const result = await db.select().from(episodes).where(eq(episodes.id, id));
    return result[0];
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [result] = await db.insert(episodes).values(episode).returning();
    return result;
  }

  async updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const [result] = await db
      .update(episodes)
      .set(episode)
      .where(eq(episodes.id, id))
      .returning();
    return result;
  }

  async deleteEpisode(id: number): Promise<boolean> {
    const result = await db.delete(episodes).where(eq(episodes.id, id)).returning({ id: episodes.id });
    return result.length > 0;
  }

  // Video Source methods
  async getVideoSources(episodeId: number): Promise<VideoSource[]> {
    return await db
      .select()
      .from(videoSources)
      .where(eq(videoSources.episodeId, episodeId));
  }

  async getVideoSource(id: number): Promise<VideoSource | undefined> {
    const result = await db.select().from(videoSources).where(eq(videoSources.id, id));
    return result[0];
  }

  async createVideoSource(source: InsertVideoSource): Promise<VideoSource> {
    const [result] = await db.insert(videoSources).values(source).returning();
    return result;
  }

  async updateVideoSource(id: number, source: Partial<InsertVideoSource>): Promise<VideoSource | undefined> {
    const [result] = await db
      .update(videoSources)
      .set(source)
      .where(eq(videoSources.id, id))
      .returning();
    return result;
  }

  async deleteVideoSource(id: number): Promise<boolean> {
    const result = await db.delete(videoSources).where(eq(videoSources.id, id)).returning({ id: videoSources.id });
    return result.length > 0;
  }

  // Genre methods
  async getGenres(): Promise<Genre[]> {
    return await db.select().from(genres).orderBy(genres.name);
  }

  // User Session methods
  async getUserSessions(userId: number): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.lastActive));
  }

  async createUserSession(userId: number, ipAddress: string, deviceInfo?: string): Promise<UserSession> {
    const [result] = await db
      .insert(userSessions)
      .values({
        userId,
        ipAddress,
        deviceInfo: deviceInfo || "Unknown",
        lastActive: new Date()
      })
      .returning();
    return result;
  }

  async updateUserSessionActivity(id: number): Promise<UserSession | undefined> {
    const [result] = await db
      .update(userSessions)
      .set({ lastActive: new Date() })
      .where(eq(userSessions.id, id))
      .returning();
    return result;
  }

  async deleteUserSession(id: number): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.id, id)).returning({ id: userSessions.id });
    return result.length > 0;
  }

  // Watchlist methods
  async addToWatchlist(userId: number, animeId: number): Promise<void> {
    const exists = await db
      .select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.animeId, animeId)));
    
    if (exists.length === 0) {
      await db.insert(watchlist).values({ userId, animeId });
    }
  }

  async removeFromWatchlist(userId: number, animeId: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.animeId, animeId)));
  }

  async getWatchlist(userId: number): Promise<Anime[]> {
    // Get basic anime info from watchlist
    const result = await db
      .select({ anime: animes })
      .from(watchlist)
      .innerJoin(animes, eq(watchlist.animeId, animes.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt));
    
    // Get all anime IDs
    const animeIds = result.map(r => r.anime.id);
    
    if (animeIds.length === 0) {
      return [];
    }
    
    // Build anime objects with genres
    const animeWithGenres = [];
    
    for (const r of result) {
      // Get genres for this specific anime
      const genreResults = await db
        .select({
          id: genres.id,
          name: genres.name
        })
        .from(animeGenres)
        .innerJoin(genres, eq(animeGenres.genreId, genres.id))
        .where(eq(animeGenres.animeId, r.anime.id));
      
      // Add genres to the anime object
      animeWithGenres.push({
        ...r.anime,
        genres: genreResults
      });
    }
    
    return animeWithGenres;
  }

  // Favorites methods
  async addToFavorites(userId: number, animeId: number): Promise<void> {
    const exists = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.animeId, animeId)));
    
    if (exists.length === 0) {
      await db.insert(favorites).values({ userId, animeId });
    }
  }

  async removeFromFavorites(userId: number, animeId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.animeId, animeId)));
  }

  async getFavorites(userId: number): Promise<Anime[]> {
    // Get basic anime info from favorites
    const result = await db
      .select({ anime: animes })
      .from(favorites)
      .innerJoin(animes, eq(favorites.animeId, animes.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.addedAt));
    
    // Get all anime IDs
    const animeIds = result.map(r => r.anime.id);
    
    if (animeIds.length === 0) {
      return [];
    }
    
    // Build anime objects with genres
    const animeWithGenres = [];
    
    for (const r of result) {
      // Get genres for this specific anime
      const genreResults = await db
        .select({
          id: genres.id,
          name: genres.name
        })
        .from(animeGenres)
        .innerJoin(genres, eq(animeGenres.genreId, genres.id))
        .where(eq(animeGenres.animeId, r.anime.id));
      
      // Add genres to the anime object
      animeWithGenres.push({
        ...r.anime,
        genres: genreResults
      });
    }
    
    return animeWithGenres;
  }

  // Watch Progress methods
  async updateWatchProgress(userId: number, episodeId: number, progress: number, completed: boolean): Promise<void> {
    const exists = await db
      .select()
      .from(watchProgress)
      .where(and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId)));
    
    if (exists.length === 0) {
      await db.insert(watchProgress).values({ 
        userId, 
        episodeId, 
        progress,
        completed,
        updatedAt: new Date()
      });
    } else {
      await db
        .update(watchProgress)
        .set({ 
          progress, 
          completed,
          updatedAt: new Date()
        })
        .where(and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId)));
    }
  }

  async getWatchProgress(userId: number, episodeId: number): Promise<number | undefined> {
    const result = await db
      .select()
      .from(watchProgress)
      .where(and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId)));
    
    return result[0]?.progress;
  }

  // Download methods
  async recordDownload(userId: number, episodeId: number, quality: string, ipAddress?: string): Promise<void> {
    await db.insert(downloads).values({
      userId,
      episodeId,
      quality,
      ipAddress,
      downloadedAt: new Date(),
      completed: true
    });
  }
}

export const storage = new DatabaseStorage();
