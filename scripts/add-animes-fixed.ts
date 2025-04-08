import { db, client, pool } from "../server/db";
import { animes, animeGenres, genres } from "@shared/schema";

async function main() {
  try {
    console.log("Starting to add anime entries...");
    
    // Get existing anime count
    const existingAnimes = await db.select().from(animes);
    console.log(`Found ${existingAnimes.length} existing anime entries.`);
    
    // Verify the genres
    const allGenres = await db.select().from(genres);
    console.log(`Found ${allGenres.length} genres in the database:`, allGenres.map(g => `${g.id}: ${g.name}`).join(', '));
    
    // Mapping of category names to IDs - important for consistency
    const genreMap: Record<string, number> = {};
    allGenres.forEach(genre => {
      genreMap[genre.name.toLowerCase()] = genre.id;
    });
    
    console.log("Genre mapping:", genreMap);
    
    // Data for new anime entries with genres properly mapped
    const animeData = [
      {
        title: "Naruto",
        description: "Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition and dreams of becoming the Hokage, the village's leader and strongest ninja.",
        type: "TV" as const,
        status: "Completed" as const,
        releaseYear: 2002,
        rating: 8.3,
        duration: "23 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/13/17405.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/13/17405l.jpg",
        featured: false,
        genres: ["Action", "Adventure", "Supernatural"]
      },
      {
        title: "One Piece",
        description: "Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger. The famous mystery treasure named 'One Piece'.",
        type: "TV" as const,
        status: "Ongoing" as const,
        releaseYear: 1999,
        rating: 8.7,
        duration: "24 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/6/73245.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/6/73245l.jpg",
        featured: true,
        genres: ["Action", "Adventure", "Comedy"]
      },
      {
        title: "Bleach",
        description: "High school student Ichigo Kurosaki, who has the ability to see ghosts, gains soul reaper powers from Rukia Kuchiki and sets out to save the world from 'Hollows'.",
        type: "TV" as const,
        status: "Completed" as const,
        releaseYear: 2004,
        rating: 8.2,
        duration: "24 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/3/40451.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/3/40451l.jpg",
        featured: false,
        genres: ["Action", "Adventure", "Supernatural"]
      },
      {
        title: "Fullmetal Alchemist: Brotherhood",
        description: "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes wrong and leaves them in damaged physical forms.",
        type: "TV" as const,
        status: "Completed" as const,
        releaseYear: 2009,
        rating: 9.2,
        duration: "24 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/1223/96541l.jpg",
        featured: true,
        genres: ["Action", "Adventure", "Fantasy"]
      },
      {
        title: "Hunter x Hunter (2011)",
        description: "Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends and his potential, he seeks out his father, who abandoned him when he was younger.",
        type: "TV" as const,
        status: "Completed" as const,
        releaseYear: 2011,
        rating: 9.1,
        duration: "23 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/11/33657.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/11/33657l.jpg",
        featured: false,
        genres: ["Action", "Adventure", "Supernatural"]
      },
      {
        title: "Haikyuu!!",
        description: "Hinata Shouyou, a small-statured high school volleyball enthusiast, must work with his archrival Kageyama Tobio to reform the school's volleyball team and take it to the national championships.",
        type: "TV" as const,
        status: "Completed" as const,
        releaseYear: 2014,
        rating: 8.8,
        duration: "25 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/7/76014.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/7/76014l.jpg",
        featured: false,
        genres: ["Sports", "Comedy", "Slice of Life"]
      },
      {
        title: "Your Name",
        description: "Two teenagers share a profound, magical connection upon discovering they are swapping bodies. But a disaster threatens to upend their lives.",
        type: "Movie" as const,
        status: "Completed" as const,
        releaseYear: 2016,
        rating: 9.0,
        duration: "1 hr 46 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/5/87048l.jpg",
        featured: true,
        genres: ["Drama", "Romance", "Fantasy"]
      },
      {
        title: "Steins;Gate",
        description: "A self-proclaimed mad scientist discovers time travel and must use it to prevent a devastating future.",
        type: "TV" as const,
        status: "Completed" as const,
        releaseYear: 2011,
        rating: 9.1,
        duration: "24 min",
        coverImage: "https://cdn.myanimelist.net/images/anime/5/73199.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/5/73199l.jpg",
        featured: false,
        genres: ["Thriller", "Psychological", "Sci-Fi"]
      }
    ];
    
    // Set of existing anime titles to avoid duplicates
    const existingTitles = new Set(existingAnimes.map(anime => anime.title));
    
    // Filter out animes that already exist
    const filteredAnimeData = animeData.filter(anime => !existingTitles.has(anime.title));
    console.log(`Adding ${filteredAnimeData.length} new anime entries...`);
    
    for (const anime of filteredAnimeData) {
      // Extract genres and other data
      const { genres: genreNames, ...animeData } = anime;
      
      // Insert anime
      const [createdAnime] = await db.insert(animes).values(animeData).returning();
      console.log(`Added anime: ${createdAnime.title} (ID: ${createdAnime.id})`);
      
      // Insert genre relationships with proper mapping
      if (genreNames && genreNames.length > 0) {
        for (const genreName of genreNames) {
          const genreId = genreMap[genreName.toLowerCase()];
          
          if (!genreId) {
            console.warn(`  - Warning: Genre "${genreName}" not found in the database, skipping`);
            continue;
          }
          
          await db.insert(animeGenres).values({
            animeId: createdAnime.id,
            genreId
          });
          console.log(`  - Added genre "${genreName}" (ID: ${genreId}) to anime ID ${createdAnime.id}`);
        }
      }
    }
    
    console.log("Finished adding anime entries.");
    
    // Get final count
    const updatedAnimes = await db.select().from(animes);
    console.log(`Total anime count: ${updatedAnimes.length}`);
    
    // Now let's fix the getAnimes method by checking what's in the database vs. API
    console.log("\nFixing search issue by diagnosing database vs. API");
    
    console.log("\nNow fix the join between animes and genres for proper display");
    // Run a query to check for anime-genre relationships
    const animeGenreRelations = await db.select().from(animeGenres);
    console.log(`Found ${animeGenreRelations.length} anime-genre relationships`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error adding anime entries:", error);
    process.exit(1);
  }
}

main();