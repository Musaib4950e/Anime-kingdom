import { db } from "../server/db";
import { animes, animeGenres, seasons, episodes, videoSources } from "../shared/schema";

async function main() {
  console.log("Starting minimal seeding...");

  // Create a single anime
  const [anime] = await db.insert(animes).values({
    title: "One Punch Man",
    description: "The story of Saitama, a hero who can defeat any opponent with a single punch but seeks to find a worthy opponent after growing bored by a lack of challenge.",
    type: "TV",
    status: "Completed",
    releaseYear: 2015,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/12/76049l.jpg",
    featured: true
  }).returning();
  
  console.log(`Created anime: ${anime.title}`);
  
  // Add genres
  await db.insert(animeGenres).values({
    animeId: anime.id,
    genreId: 16 // Action
  });
  
  await db.insert(animeGenres).values({
    animeId: anime.id,
    genreId: 20 // Comedy
  });
  
  // Create a season
  const [season] = await db.insert(seasons).values({
    animeId: anime.id,
    number: 1,
    title: "Season 1"
  }).returning();
  
  console.log(`Created season 1 for ${anime.title}`);
  
  // Create episodes
  const [episode1] = await db.insert(episodes).values({
    seasonId: season.id,
    number: 1,
    title: "The Strongest Man",
    description: "Saitama is a hero who only became a hero for fun. After three years of special training, he's become so strong that he's practically invincible. In fact, he's too strong—even his mightiest opponents are taken out with a single punch.",
    duration: "24:00",
    thumbnail: anime.coverImage
  }).returning();
  
  console.log(`Created episode 1`);
  
  // Add video sources
  await db.insert(videoSources).values({
    episodeId: episode1.id,
    quality: "720p",
    url: "https://example.com/video/720p.mp4",
    size: "300MB"
  });
  
  await db.insert(videoSources).values({
    episodeId: episode1.id,
    quality: "1080p",
    url: "https://example.com/video/1080p.mp4",
    size: "800MB"
  });
  
  // Another episode
  const [episode2] = await db.insert(episodes).values({
    seasonId: season.id,
    number: 2,
    title: "The Lone Cyborg",
    description: "Saitama tags along with Genos to defeat a monster threatening the city. Later, a new challenge appears in the form of the Deep Sea King.",
    duration: "24:00",
    thumbnail: anime.coverImage
  }).returning();
  
  console.log(`Created episode 2`);
  
  await db.insert(videoSources).values({
    episodeId: episode2.id,
    quality: "720p",
    url: "https://example.com/video/720p.mp4",
    size: "300MB"
  });
  
  await db.insert(videoSources).values({
    episodeId: episode2.id,
    quality: "1080p",
    url: "https://example.com/video/1080p.mp4",
    size: "800MB"
  });
  
  console.log("Minimal seeding complete!");
}

main().catch(e => {
  console.error("Error during seeding:", e);
  process.exit(1);
}).finally(() => {
  process.exit(0);
});