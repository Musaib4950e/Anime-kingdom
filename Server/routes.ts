import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAnimeSchema, insertSeasonSchema, insertEpisodeSchema, insertVideoSourceSchema, users as usersTable } from "@shared/schema";
import { db } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Password helper functions
const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && (req.user as any).role === "Admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Anime routes
  
  // Search endpoint for autocomplete
  app.get("/api/animes/search", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;
      const limit = parseInt(req.query.limit as string || '5');
      
      if (!query || query.length < 2) {
        return res.json({ data: [] });
      }
      
      console.log(`Searching animes for: "${query}" (limit: ${limit})`);
      
      // Get all animes
      console.log("Fetching all animes from database...");
      const allAnimes = await storage.getAnimes();
      console.log(`Successfully fetched ${allAnimes.length} animes`);
      
      // Prepare the query
      const normalizedQuery = query.toLowerCase().trim();
      
      // Filter animes by title only (ignore description)
      const filteredAnimes = allAnimes.filter(anime => {
        const title = anime.title.toLowerCase();
        return title.includes(normalizedQuery);
      });
      
      // Sort by relevance - exact matches first, starts with second, includes third
      const sortedResults = filteredAnimes.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        
        // Exact match gets highest priority
        if (titleA === normalizedQuery && titleB !== normalizedQuery) return -1;
        if (titleB === normalizedQuery && titleA !== normalizedQuery) return 1;
        
        // Starts with gets second priority
        if (titleA.startsWith(normalizedQuery) && !titleB.startsWith(normalizedQuery)) return -1;
        if (titleB.startsWith(normalizedQuery) && !titleA.startsWith(normalizedQuery)) return 1;
        
        // Otherwise alphabetical
        return titleA.localeCompare(titleB);
      }).slice(0, limit);
      
      // Return the results
      const results = sortedResults;
      
      console.log(`Found ${results.length} results, returning ${results.length}`);
      return res.json({ data: results });
    } catch (error) {
      console.error('Error in anime search:', error);
      res.status(500).send('Internal server error');
    }
  });
  
  app.get("/api/animes", async (req, res) => {
    try {
      console.log("API request: GET /api/animes");
      
      // Extract filter parameters from query string
      const filters = {
        search: req.query.search as string | undefined,
        genreId: req.query.genreId ? parseInt(req.query.genreId as string) : undefined,
        year: req.query.year as string | undefined,
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
        order: req.query.order as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 25
      };
      
      console.log("Applied filters:", filters);
      
      // Get all animes first
      console.log("Fetching all animes from database...");
      const allAnimes = await storage.getAnimes();
      console.log(`Successfully fetched ${allAnimes.length} animes`);
      
      // Apply filters manually if the database doesn't support it
      let filteredAnimes = [...allAnimes];
      
      // Apply search filter with a focus on title-only matching
      if (filters.search && filters.search.trim() !== '') {
        const searchLower = filters.search.toLowerCase().trim();
        // Always filter by title only (ignoring description)
        console.log(`Applying search filter for: "${filters.search}" (title-only match)`);
        
        // Title-based search to only match titles containing the search term
        filteredAnimes = filteredAnimes.filter(anime => {
          const titleLower = anime.title.toLowerCase();
          return titleLower.includes(searchLower);
        });
        
        // Sort results by relevance (exact matches first, then starts with, then contains)
        filteredAnimes.sort((a, b) => {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          
          // Exact match gets highest priority
          if (titleA === searchLower && titleB !== searchLower) return -1;
          if (titleB === searchLower && titleA !== searchLower) return 1;
          
          // Starts with gets second priority
          if (titleA.startsWith(searchLower) && !titleB.startsWith(searchLower)) return -1;
          if (titleB.startsWith(searchLower) && !titleA.startsWith(searchLower)) return 1;
          
          // Otherwise alphabetical
          return titleA.localeCompare(titleB);
        });
        console.log(`Search filter matched ${filteredAnimes.length} animes`);
      }
      
      // Apply genre filter
      if (filters.genreId) {
        // This is a simplistic approach. In a real app, you'd need a proper join query
        filteredAnimes = filteredAnimes.filter(anime => 
          anime.genres?.some((genre: {id: number, name: string}) => genre.id === filters.genreId)
        );
      }
      
      // Apply year filter
      if (filters.year && filters.year !== 'All') {
        filteredAnimes = filteredAnimes.filter(anime => {
          const year = filters.year ? parseInt(filters.year) : null;
          return year ? anime.releaseYear === year : true;
        });
      }
      
      // Apply status filter
      if (filters.status && filters.status !== 'All') {
        filteredAnimes = filteredAnimes.filter(anime => 
          anime.status === filters.status
        );
      }
      
      // Apply type filter
      if (filters.type && filters.type !== 'All') {
        filteredAnimes = filteredAnimes.filter(anime => 
          anime.type === filters.type
        );
      }
      
      // Calculate total before pagination
      const total = filteredAnimes.length;
      
      // Apply ordering
      if (filters.order) {
        switch (filters.order) {
          case 'Latest':
            filteredAnimes.sort((a, b) => b.releaseYear - a.releaseYear);
            break;
          case 'Oldest':
            filteredAnimes.sort((a, b) => a.releaseYear - b.releaseYear);
            break;
          case 'Title (A-Z)':
            filteredAnimes.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'Title (Z-A)':
            filteredAnimes.sort((a, b) => b.title.localeCompare(a.title));
            break;
          case 'Rating (High-Low)':
            filteredAnimes.sort((a, b) => Number(b.rating) - Number(a.rating));
            break;
          case 'Rating (Low-High)':
            filteredAnimes.sort((a, b) => Number(a.rating) - Number(b.rating));
            break;
        }
      }
      
      // Apply pagination
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginatedAnimes = filteredAnimes.slice(startIndex, endIndex);
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(total / filters.limit);
      const hasNextPage = filters.page < totalPages;
      const hasPrevPage = filters.page > 1;
      
      console.log(`Returning ${paginatedAnimes.length} animes (filtered from ${total})`);
      
      // Return paginated results with metadata
      res.json({
        data: paginatedAnimes,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (error) {
      console.error("Error in GET /api/animes:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch animes", error: errorMessage });
    }
  });

  app.get("/api/animes/:id", async (req, res) => {
    try {
      const anime = await storage.getAnime(parseInt(req.params.id));
      if (!anime) {
        return res.status(404).json({ message: "Anime not found" });
      }
      res.json(anime);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch anime" });
    }
  });

  app.post("/api/animes", isAdmin, async (req, res) => {
    try {
      const validationResult = insertAnimeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      const anime = await storage.createAnime(validationResult.data);
      res.status(201).json(anime);
    } catch (error) {
      res.status(500).json({ message: "Failed to create anime" });
    }
  });

  app.put("/api/animes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const anime = await storage.updateAnime(id, req.body);
      if (!anime) {
        return res.status(404).json({ message: "Anime not found" });
      }
      res.json(anime);
    } catch (error) {
      res.status(500).json({ message: "Failed to update anime" });
    }
  });

  app.delete("/api/animes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAnime(id);
      if (!success) {
        return res.status(404).json({ message: "Anime not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete anime" });
    }
  });

  // Season routes
  app.get("/api/animes/:animeId/seasons", async (req, res) => {
    try {
      const animeId = parseInt(req.params.animeId);
      const seasons = await storage.getSeasons(animeId);
      res.json({ data: seasons });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seasons" });
    }
  });

  // Get all seasons (used for admin section)
  app.get("/api/seasons", async (req, res) => {
    try {
      // If animeId is provided as a query param, filter seasons by anime
      const animeIdParam = req.query.animeId;
      if (animeIdParam) {
        const animeId = parseInt(animeIdParam as string);
        const seasons = await storage.getSeasons(animeId);
        return res.json({ data: seasons });
      }
      
      // Otherwise return all seasons (not recommended for large datasets)
      const allSeasons = await storage.getAllSeasons();
      res.json({ data: allSeasons });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seasons" });
    }
  });

  app.post("/api/seasons", isAdmin, async (req, res) => {
    try {
      const validationResult = insertSeasonSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      const season = await storage.createSeason(validationResult.data);
      res.status(201).json(season);
    } catch (error) {
      res.status(500).json({ message: "Failed to create season" });
    }
  });

  app.put("/api/seasons/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const season = await storage.updateSeason(id, req.body);
      if (!season) {
        return res.status(404).json({ message: "Season not found" });
      }
      res.json(season);
    } catch (error) {
      res.status(500).json({ message: "Failed to update season" });
    }
  });

  app.delete("/api/seasons/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSeason(id);
      if (!success) {
        return res.status(404).json({ message: "Season not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete season" });
    }
  });

  // Episode routes
  app.get("/api/seasons/:seasonId/episodes", async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const episodes = await storage.getEpisodes(seasonId);
      res.json({ data: episodes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  app.post("/api/episodes", isAdmin, async (req, res) => {
    try {
      const validationResult = insertEpisodeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      // First verify that the seasonId exists
      const seasonId = validationResult.data.seasonId;
      const season = await storage.getSeason(seasonId);
      
      if (!season) {
        return res.status(400).json({ 
          message: "Failed to create episode", 
          error: `Season with ID ${seasonId} does not exist` 
        });
      }
      
      console.log("Creating episode with data:", JSON.stringify(validationResult.data));
      
      const episode = await storage.createEpisode(validationResult.data);
      res.status(201).json(episode);
    } catch (error: any) {
      console.error("Failed to create episode:", error);
      res.status(500).json({ message: "Failed to create episode", error: error.message });
    }
  });

  app.put("/api/episodes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const episode = await storage.updateEpisode(id, req.body);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      res.json(episode);
    } catch (error) {
      res.status(500).json({ message: "Failed to update episode" });
    }
  });

  app.delete("/api/episodes/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEpisode(id);
      if (!success) {
        return res.status(404).json({ message: "Episode not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete episode" });
    }
  });

  // Video Source routes
  app.get("/api/episodes/:episodeId/video-sources", async (req, res) => {
    try {
      const episodeId = parseInt(req.params.episodeId);
      const sources = await storage.getVideoSources(episodeId);
      res.json({ data: sources });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video sources" });
    }
  });

  app.post("/api/video-sources", isAdmin, async (req, res) => {
    try {
      const validationResult = insertVideoSourceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.format() });
      }
      
      // First verify that the episodeId exists
      const episodeId = validationResult.data.episodeId;
      const episode = await storage.getEpisode(episodeId);
      
      if (!episode) {
        return res.status(400).json({ 
          message: "Failed to create video source", 
          error: `Episode with ID ${episodeId} does not exist` 
        });
      }
      
      console.log("Creating video source with data:", JSON.stringify(validationResult.data));
      
      const source = await storage.createVideoSource(validationResult.data);
      res.status(201).json(source);
    } catch (error: any) {
      console.error("Failed to create video source:", error);
      res.status(500).json({ message: "Failed to create video source", error: error.message });
    }
  });

  app.put("/api/video-sources/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const source = await storage.updateVideoSource(id, req.body);
      if (!source) {
        return res.status(404).json({ message: "Video source not found" });
      }
      res.json(source);
    } catch (error) {
      res.status(500).json({ message: "Failed to update video source" });
    }
  });

  app.delete("/api/video-sources/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVideoSource(id);
      if (!success) {
        return res.status(404).json({ message: "Video source not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video source" });
    }
  });

  // Genres routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getGenres();
      res.json({ data: genres });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });

  // User sessions routes
  // Admin user management routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(usersTable);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role, status } = req.body;
      
      // Cast to any to avoid TypeScript error since role is not in the InsertUser type
      const userData: any = { role, status };
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Don't allow deleting the current user
      if (req.user && req.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/user-sessions", isAdmin, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAdmin middleware
      const userId = req.query.userId ? parseInt(req.query.userId as string) : (req.user as any).id;
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user sessions" });
    }
  });

  app.delete("/api/user-sessions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUserSession(id);
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Watchlist routes
  app.get("/api/watchlist", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      const animes = await storage.getWatchlist((req.user as any).id);
      res.json({ data: animes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist/:animeId", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      await storage.addToWatchlist((req.user as any).id, parseInt(req.params.animeId));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:animeId", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      await storage.removeFromWatchlist((req.user as any).id, parseInt(req.params.animeId));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      const animes = await storage.getFavorites((req.user as any).id);
      res.json({ data: animes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:animeId", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      await storage.addToFavorites((req.user as any).id, parseInt(req.params.animeId));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete("/api/favorites/:animeId", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      await storage.removeFromFavorites((req.user as any).id, parseInt(req.params.animeId));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  // Watch Progress routes
  app.post("/api/watch-progress/:episodeId", isAuthenticated, async (req, res) => {
    try {
      const { progress, completed } = req.body;
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      await storage.updateWatchProgress(
        (req.user as any).id, 
        parseInt(req.params.episodeId), 
        progress, 
        completed
      );
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to update watch progress" });
    }
  });

  app.get("/api/watch-progress/:episodeId", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      const progress = await storage.getWatchProgress((req.user as any).id, parseInt(req.params.episodeId));
      res.json({ progress });
    } catch (error) {
      res.status(500).json({ message: "Failed to get watch progress" });
    }
  });

  // Download routes
  app.post("/api/downloads/:episodeId", isAuthenticated, async (req, res) => {
    try {
      const { quality } = req.body;
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      await storage.recordDownload(
        (req.user as any).id,
        parseInt(req.params.episodeId),
        quality,
        req.ip
      );
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to record download" });
    }
  });

  // User profile management routes
  // Update profile
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { username, email } = req.body;
      
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      const user = req.user as any;
      
      // Validate input
      if (!username || !email) {
        return res.status(400).json({ message: "Username and email are required" });
      }
      
      // Check if username already exists (if username was changed)
      if (username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(user.id, { username, email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update password
  app.patch("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      const user = req.user as any;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get user from storage to check password
      const userFromDb = await storage.getUser(user.id);
      
      if (!userFromDb) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // We're using the functions defined at the top of the file
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, userFromDb.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Delete account
  app.delete("/api/user/account", isAuthenticated, async (req, res) => {
    try {
      // Using type assertion since we know req.user exists due to isAuthenticated middleware
      const user = req.user as any;
      
      // Delete user account
      const isDeleted = await storage.deleteUser(user.id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: "User not found or could not be deleted" });
      }
      
      // Logout the user
      req.logout((err) => {
        if (err) {
          console.error("Error logging out after account deletion:", err);
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
