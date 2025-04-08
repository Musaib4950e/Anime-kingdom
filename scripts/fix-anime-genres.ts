import { db } from "../server/db";
import { animes, animeGenres, genres } from "@shared/schema";

async function main() {
  try {
    console.log("Starting to fix anime-genre relationships...");
    
    // Get all animes
    const allAnimes = await db.select().from(animes);
    console.log(`Found ${allAnimes.length} anime entries.`);
    
    // Get all genres
    const allGenres = await db.select().from(genres);
    console.log(`Found ${allGenres.length} genres.`);
    
    // Create a genre map
    const genreMap = new Map<string, number>();
    allGenres.forEach(genre => {
      genreMap.set(genre.name.toLowerCase(), genre.id);
    });
    
    // Define anime-genre relationships
    const animeGenreRelationships = [
      { animeId: 1, genreNames: ["Action", "Adventure", "Supernatural"] }, // Naruto
      { animeId: 2, genreNames: ["Action", "Adventure", "Comedy"] }, // One Piece
      { animeId: 3, genreNames: ["Action", "Adventure", "Supernatural"] }, // Bleach
      { animeId: 4, genreNames: ["Action", "Adventure", "Fantasy"] }, // Fullmetal Alchemist: Brotherhood
      { animeId: 5, genreNames: ["Action", "Adventure", "Supernatural"] }, // Hunter x Hunter
      { animeId: 6, genreNames: ["Sports", "Comedy", "Slice of Life"] }, // Haikyuu!!
      { animeId: 7, genreNames: ["Drama", "Romance", "Fantasy"] }, // Your Name
      { animeId: 8, genreNames: ["Thriller", "Psychological", "Sci-Fi"] } // Steins;Gate
    ];
    
    // First, clear existing relationships to avoid duplicates
    console.log("Clearing existing anime-genre relationships...");
    await db.delete(animeGenres);
    
    // Add relationships
    console.log("Adding new anime-genre relationships...");
    let successCount = 0;
    let errorCount = 0;
    
    for (const relationship of animeGenreRelationships) {
      // Check if anime exists
      const animeExists = allAnimes.some(anime => anime.id === relationship.animeId);
      if (!animeExists) {
        console.log(`Warning: Anime with ID ${relationship.animeId} not found, skipping`);
        errorCount++;
        continue;
      }
      
      // Add genre relationships
      for (const genreName of relationship.genreNames) {
        const genreId = genreMap.get(genreName.toLowerCase());
        
        if (!genreId) {
          console.log(`Warning: Genre "${genreName}" not found, skipping`);
          errorCount++;
          continue;
        }
        
        try {
          await db.insert(animeGenres).values({
            animeId: relationship.animeId,
            genreId: genreId
          });
          
          console.log(`Added genre "${genreName}" (ID: ${genreId}) to anime ID ${relationship.animeId}`);
          successCount++;
        } catch (error) {
          console.error(`Error adding genre "${genreName}" to anime ID ${relationship.animeId}:`, error);
          errorCount++;
        }
      }
    }
    
    // Verify relationships
    const animeGenreRelations = await db.select().from(animeGenres);
    console.log(`\nCompleted with ${successCount} successful additions and ${errorCount} errors.`);
    console.log(`Total anime-genre relationships in database: ${animeGenreRelations.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error fixing anime-genre relationships:", error);
    process.exit(1);
  }
}

main();