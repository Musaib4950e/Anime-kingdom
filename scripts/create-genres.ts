import { db } from "../server/db";
import { genres } from "@shared/schema";

const genresList = [
  "Action",
  "Adventure", 
  "Comedy", 
  "Drama", 
  "Fantasy", 
  "Horror", 
  "Mystery", 
  "Romance", 
  "Sci-Fi", 
  "Slice of Life", 
  "Sports", 
  "Supernatural", 
  "Psychological", 
  "Thriller", 
  "Historical"
];

async function main() {
  try {
    console.log("Starting to create genres...");
    
    // Get existing genres
    const existingGenres = await db.select().from(genres);
    console.log(`Found ${existingGenres.length} existing genres:`, existingGenres.map(g => g.name).join(', '));
    
    // Set of existing genre names
    const existingGenreNames = new Set(existingGenres.map(genre => genre.name.toLowerCase()));
    
    // Filter out genres that already exist
    const genresToCreate = genresList.filter(genre => !existingGenreNames.has(genre.toLowerCase()));
    console.log(`Adding ${genresToCreate.length} new genres: ${genresToCreate.join(', ')}`);
    
    // Insert each genre
    for (const genreName of genresToCreate) {
      const [createdGenre] = await db.insert(genres).values({ name: genreName }).returning();
      console.log(`Added genre: ${createdGenre.name} (ID: ${createdGenre.id})`);
    }
    
    // Get updated genres
    const updatedGenres = await db.select().from(genres);
    console.log(`Total genres count: ${updatedGenres.length}`);
    console.log("Updated genres list:", updatedGenres.map(g => `${g.id}:${g.name}`).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating genres:", error);
    process.exit(1);
  }
}

main();