import { db } from "../server/db";
import { animes } from "@shared/schema";
import { storage } from "../server/storage";

async function main() {
  try {
    console.log("Diagnosing and fixing search issues...");
    
    // Get all animes in database
    const allAnimes = await db.select().from(animes);
    console.log(`Found ${allAnimes.length} anime entries in database.`);
    
    // Test the storage.getAnimes function
    const storageAnimes = await storage.getAnimes();
    console.log(`Storage.getAnimes() returned ${storageAnimes.length} anime entries.`);
    
    // If the counts don't match, there might be an issue with the database query
    if (allAnimes.length !== storageAnimes.length) {
      console.log(`WARNING: Database has ${allAnimes.length} animes but storage.getAnimes() returns ${storageAnimes.length}!`);
    }
    
    // Test the search functionality with a few queries
    console.log("\nTesting search functionality...");
    
    const searchQueries = ["naruto", "one", "hunter", "your", "steins"];
    
    for (const query of searchQueries) {
      try {
        // Call the search endpoint manually - this uses the db directly
        const searchResults = await searchAnimes(query);
        console.log(`Search for "${query}" returned ${searchResults.length} results:`);
        searchResults.forEach(anime => console.log(`  - ${anime.id}: ${anime.title}`));
      } catch (error) {
        console.error(`Error when searching for "${query}":`, error);
      }
    }
    
    console.log("\nSearch functionality test completed.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error diagnosing search issues:", error);
    process.exit(1);
  }
}

// Implement a function similar to how the API would perform search
async function searchAnimes(query: string, limit: number = 5) {
  console.log(`Searching animes for: "${query}" (limit: ${limit})`);
  
  if (!query || query.trim() === "") {
    console.log("Empty query, returning empty results");
    return [];
  }
  
  // Get all animes first
  console.log("Fetching all animes from database...");
  const allAnimes = await db.select().from(animes);
  console.log(`Successfully fetched ${allAnimes.length} animes`);
  
  // Perform relevance scoring
  const results = allAnimes
    .map(anime => {
      // Calculate relevance score based on title and description matches
      const titleLower = anime.title.toLowerCase();
      const descLower = anime.description.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Calculate title match (higher weight)
      const titleExactMatch = titleLower === queryLower ? 5 : 0;
      const titleStartsWithMatch = titleLower.startsWith(queryLower) ? 3 : 0;
      const titleIncludesMatch = titleLower.includes(queryLower) ? 2 : 0;
      
      // Calculate description match (lower weight)
      const descIncludesMatch = descLower.includes(queryLower) ? 1 : 0;
      
      // Calculate total score
      const score = titleExactMatch + titleStartsWithMatch + titleIncludesMatch + descIncludesMatch;
      
      return {
        anime,
        score
      };
    })
    .filter(result => result.score > 0) // Remove non-matching results
    .sort((a, b) => b.score - a.score) // Sort by score (descending)
    .slice(0, limit) // Limit the number of results
    .map(result => result.anime); // Extract the anime objects
  
  console.log(`Found ${results.length} results with relevance scoring, returning ${results.length}`);
  return results;
}

main();