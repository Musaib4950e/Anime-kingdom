import { db } from "../server/db";
import { 
  users, 
  genres, 
  animes, 
  animeGenres, 
  seasons, 
  episodes, 
  videoSources,
  userRoleEnum,
  animeTypeEnum,
  animeStatusEnum
} from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Starting database seeding...");

  // Add admin user
  const adminPassword = await hashPassword("admin123");
  const adminUser = await db.insert(users).values({
    username: "admin",
    email: "admin@example.com",
    password: adminPassword,
    role: "Admin",
  }).returning();
  
  console.log("Created admin user:", adminUser[0].username);

  // Add genres
  const genreNames = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
    "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", 
    "Sports", "Supernatural", "Psychological", "Thriller", "Historical"
  ];
  
  const createdGenres = await Promise.all(
    genreNames.map(name => 
      db.insert(genres).values({ name }).returning()
    )
  );
  
  const genreMap = createdGenres.reduce((acc, genre) => {
    acc[genre[0].name] = genre[0].id;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("Created genres:", Object.keys(genreMap).join(", "));

  // Create anime entries
  const animeList = [
    {
      title: "My Hero Academia",
      description: "In a world where people with superpowers (known as 'Quirks') are the norm, Izuku Midoriya has dreams of one day becoming a Hero, despite being bullied by his classmates for not having a Quirk. After meeting All Might, the world's greatest Hero, Izuku's life changes forever.",
      type: "TV" as const,
      status: "Ongoing" as const,
      releaseYear: 2016,
      rating: 8.4,
      duration: "24 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/13/80000.jpg",
      featured: true,
      genres: ["Action", "Adventure", "Comedy", "Supernatural"]
    },
    {
      title: "One Piece",
      description: "Gol D. Roger was known as the 'Pirate King,' the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world.",
      type: "TV" as const,
      status: "Ongoing" as const,
      releaseYear: 1999,
      rating: 9.0,
      duration: "24 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/6/73245.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/13/23232.jpg",
      featured: true,
      genres: ["Action", "Adventure", "Comedy", "Fantasy"]
    },
    {
      title: "Fullmetal Alchemist: Brotherhood",
      description: "After a terrible alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic situation. Now the brothers travel the world, searching for the Philosopher's Stone to restore their bodies.",
      type: "TV" as const,
      status: "Completed" as const,
      releaseYear: 2009,
      rating: 9.2,
      duration: "24 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/7/74317.jpg",
      featured: true,
      genres: ["Action", "Adventure", "Drama", "Fantasy"]
    },
    {
      title: "Hunter x Hunter",
      description: "Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends and his potential, he seeks out his father, who left him when he was younger.",
      type: "TV" as const,
      status: "Completed" as const,
      releaseYear: 2011,
      rating: 9.1,
      duration: "23 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/11/33657.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/13/33657.jpg",
      featured: true,
      genres: ["Action", "Adventure", "Fantasy"]
    },
    {
      title: "Mob Psycho 100",
      description: "A psychic middle school boy tries to live a normal life and keep his growing powers under control, even though he constantly gets into trouble.",
      type: "TV" as const,
      status: "Completed" as const,
      releaseYear: 2016,
      rating: 8.7,
      duration: "24 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/5/80000.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/12/80000.jpg",
      featured: false,
      genres: ["Action", "Comedy", "Supernatural", "Psychological"]
    },
    {
      title: "Attack on Titan",
      description: "In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason, a young boy vows to exterminate them after a Titan destroys his hometown and kills his mother.",
      type: "TV" as const,
      status: "Completed" as const,
      releaseYear: 2013,
      rating: 9.1,
      duration: "25 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg",
      featured: true,
      genres: ["Action", "Drama", "Fantasy", "Mystery"]
    },
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
      genres: ["Action", "Adventure", "Comedy", "Supernatural"]
    },
    {
      title: "Your Name",
      description: "Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?",
      type: "Movie" as const,
      status: "Completed" as const,
      releaseYear: 2016,
      rating: 9.0,
      duration: "106 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/5/87048l.jpg",
      featured: false,
      genres: ["Romance", "Supernatural", "Drama"]
    },
    {
      title: "Bleach",
      description: "High school student Ichigo Kurosaki, who has the ability to see ghosts, gains soul reaper powers from a soul reaper named Rukia Kuchiki and sets out to save the world from 'Hollows'.",
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
      title: "Tokyo Ghoul",
      description: "A Tokyo college student is attacked by a ghoul, a superpowered human who feeds on human flesh. He survives, but has become part ghoul and becomes a fugitive on the run.",
      type: "TV" as const,
      status: "Completed" as const,
      releaseYear: 2014,
      rating: 7.8,
      duration: "24 min",
      coverImage: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
      bannerImage: "https://cdn.myanimelist.net/images/anime/5/64449l.jpg",
      featured: false,
      genres: ["Action", "Horror", "Supernatural", "Psychological"]
    }
  ];

  for (const animeData of animeList) {
    const { genres: animeGenreNames, ...rest } = animeData;
    
    // Create anime entry
    const [createdAnime] = await db.insert(animes).values(rest).returning();
    console.log(`Created anime: ${createdAnime.title}`);
    
    // Add genres to anime
    for (const genreName of animeGenreNames) {
      const genreId = genreMap[genreName];
      if (genreId) {
        await db.insert(animeGenres).values({
          animeId: createdAnime.id,
          genreId
        });
      }
    }
    
    // Create seasons for anime
    const seasonCount = Math.floor(Math.random() * 3) + 1; // 1-3 seasons
    for (let i = 1; i <= seasonCount; i++) {
      const [createdSeason] = await db.insert(seasons).values({
        animeId: createdAnime.id,
        number: i,
        title: `Season ${i}`
      }).returning();
      
      console.log(`Created season ${i} for ${createdAnime.title}`);
      
      // Create episodes for season
      const episodeCount = Math.floor(Math.random() * 10) + 5; // 5-14 episodes
      for (let j = 1; j <= episodeCount; j++) {
        const [createdEpisode] = await db.insert(episodes).values({
          seasonId: createdSeason.id,
          number: j,
          title: `Episode ${j}`,
          description: `This is episode ${j} of season ${i} for ${createdAnime.title}`,
          duration: "24:00",
          thumbnail: createdAnime.coverImage
        }).returning();
        
        // Add video sources for the episode
        await db.insert(videoSources).values({
            episodeId: createdEpisode.id,
            quality: "720p",
            url: "https://example.com/video/720p.mp4",
            size: "300MB"
        });
        
        await db.insert(videoSources).values({
            episodeId: createdEpisode.id,
            quality: "1080p",
            url: "https://example.com/video/1080p.mp4",
            size: "800MB"
        });
      }
    }
  }

  console.log("Seeding complete!");
}

main().catch(e => {
  console.error("Error during seeding:", e);
  process.exit(1);
}).finally(() => {
  process.exit(0);
});