import { db } from "../server/db";
import { animes, animeGenres } from "@shared/schema";

// Helper function to get a random integer between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random genres (between 1 and 4)
function getRandomGenres(excludedGenres: number[] = []): number[] {
  // Available genre IDs from 16 to 30
  const availableGenres = Array.from({ length: 15 }, (_, i) => i + 16)
    .filter(id => !excludedGenres.includes(id));
  
  const numGenres = getRandomInt(1, 4);
  const selectedGenres: number[] = [];
  
  while (selectedGenres.length < numGenres && availableGenres.length > 0) {
    const randomIndex = getRandomInt(0, availableGenres.length - 1);
    const genre = availableGenres.splice(randomIndex, 1)[0];
    selectedGenres.push(genre);
  }
  
  return selectedGenres;
}

// Anime data with correct cover and banner images
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
    genres: [16, 30, 18]
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
    genres: [16, 30, 20]
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
    genres: [16, 30, 18]
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
    genres: [16, 30, 23]
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
    genres: [16, 30, 18]
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
    genres: [17, 20, 24]
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
    genres: [28, 21, 23]
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
    genres: [26, 19, 25]
  },
  {
    title: "One Punch Man",
    description: "The story of Saitama, a hero who can defeat any enemy with a single punch but seeks a worthy opponent after growing bored by a lack of challenge.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2015,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/12/76049l.jpg",
    featured: false,
    genres: [16, 20, 18]
  },
  {
    title: "Violet Evergarden",
    description: "A former soldier adjusts to civilian life by working as an Auto Memory Doll, writing letters for others while trying to understand the final words her mentor said to her.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2018,
    rating: 8.9,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1795/95088l.jpg",
    featured: false,
    genres: [28, 23, 24]
  },
  {
    title: "Jujutsu Kaisen",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman school to be able to locate the demon's other body parts and thus exorcise himself.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2020,
    rating: 8.8,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1171/109222l.jpg",
    featured: true,
    genres: [16, 18, 29]
  },
  {
    title: "A Silent Voice",
    description: "A young man is ostracized by his classmates after he bullies a deaf girl to the point where she moves away. Years later, he sets off on a path for redemption.",
    type: "Movie" as const,
    status: "Completed" as const,
    releaseYear: 2016,
    rating: 9.0,
    duration: "2 hr 10 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1122/96435.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1122/96435l.jpg",
    featured: false,
    genres: [28, 24]
  },
  {
    title: "Cowboy Bebop",
    description: "The futuristic misadventures and tragedies of an easygoing bounty hunter and his partners.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 1998,
    rating: 8.9,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/4/19644.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/4/19644l.jpg",
    featured: false,
    genres: [16, 25, 18]
  },
  {
    title: "Made in Abyss",
    description: "A young girl and a robot descend into a mysterious and dangerous abyss in search of her missing mother.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2017,
    rating: 8.8,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/6/86733.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/6/86733l.jpg",
    featured: false,
    genres: [30, 23, 22]
  },
  {
    title: "Mob Psycho 100",
    description: "A psychic middle school boy tries to live a normal life and keep his growing powers under control, even though he constantly gets into trouble.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2016,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/4/80036.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/4/80036l.jpg",
    featured: false,
    genres: [16, 20, 18]
  },
  {
    title: "Re:Zero",
    description: "Shortly after being summoned to a new world, Subaru Natsuki and his new female companion are brutally murdered. But then he awakens to find himself in the same alley, with the same thugs, the same girl, and the day begins to repeat.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2016,
    rating: 8.6,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1275/147862.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1275/147862l.jpg",
    featured: false,
    genres: [19, 26, 23]
  },
  {
    title: "Vinland Saga",
    description: "Thorfinn pursues a journey with his father's killer in order to take revenge and end his life in a duel as an honorable warrior and pay his father a homage.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2019,
    rating: 8.8,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1500/103005.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1500/103005l.jpg",
    featured: false,
    genres: [16, 30, 27]
  },
  {
    title: "Mushoku Tensei",
    description: "A 34-year-old unemployed otaku is killed in a traffic accident and reincarnated in an infant's body in a world of sword and sorcery.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2021,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1530/117776.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1530/117776l.jpg",
    featured: false,
    genres: [30, 23, 28]
  },
  {
    title: "Tokyo Ghoul",
    description: "A Tokyo college student is attacked by a ghoul, a superpowered human who feeds on human flesh. He survives, but has become part ghoul and becomes a fugitive on the run.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2014,
    rating: 8.0,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/5/64449l.jpg",
    featured: false,
    genres: [16, 19, 29]
  },
  {
    title: "Black Clover",
    description: "Asta and Yuno were abandoned at the same church on the same day. Raised together as children, they came to know of the 'Wizard King'—a title given to the strongest mage in the kingdom—and promised that they would compete against each other for the position of the next Wizard King.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2017,
    rating: 7.9,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/2/88336.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/2/88336l.jpg",
    featured: false,
    genres: [16, 30, 23]
  },
  {
    title: "The Promised Neverland",
    description: "When the brightest kids at a seemingly perfect orphanage discover the dark truth of their existence, they make a risky escape plan.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2019,
    rating: 8.6,
    duration: "22 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1125/96929.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1125/96929l.jpg",
    featured: false,
    genres: [29, 26, 19]
  },
  {
    title: "Chainsaw Man",
    description: "Young devil hunter Denji is reborn as a hybrid between human and devil after a devil betrayal causes his death as a human. Denji now has a chainsaw for a head which he can use as a weapon.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2022,
    rating: 8.5,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1090/147508.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1090/147508l.jpg",
    featured: false,
    genres: [16, 29, 30]
  },
  {
    title: "Code Geass",
    description: "After being given a mysterious power by a young girl, Lelouch, an exiled prince, begins a bloody rebellion against the Britannia Empire.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2006,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/50331.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/5/50331l.jpg",
    featured: false,
    genres: [16, 25, 26]
  },
  {
    title: "Gurren Lagann",
    description: "Simon and Kamina are two teenagers stuck underground in an oppressive society. When they discover a mysterious artifact, they use it to break to the surface and battle those who would deny humanity its right to look at the sky.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2007,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/4/5123.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/4/5123l.jpg",
    featured: false,
    genres: [16, 25, 20]
  },
  {
    title: "Your Lie in April",
    description: "A piano prodigy who lost his ability to play after suffering a traumatic event in his childhood is forced back into the spotlight by an eccentric girl with a secret of her own.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2014,
    rating: 8.7,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/3/67177.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/3/67177l.jpg",
    featured: false,
    genres: [28, 21, 24]
  },
  {
    title: "Neon Genesis Evangelion",
    description: "A teenage boy finds himself recruited as a member of an elite team of pilots by his father.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 1995,
    rating: 8.6,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1314/108941.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1314/108941l.jpg",
    featured: false,
    genres: [16, 25, 19]
  },
  {
    title: "Assassination Classroom",
    description: "A powerful creature claims he'll destroy the earth within a year. But first, he wants to teach a junior high school class.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2015,
    rating: 8.3,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/75639.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/5/75639l.jpg",
    featured: false,
    genres: [16, 20, 24]
  },
  {
    title: "Dragon Ball Z",
    description: "After learning that he is from another planet, a warrior named Goku and his friends are prompted to defend it from an onslaught of extraterrestrial enemies.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 1989,
    rating: 8.2,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1607/117271.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1607/117271l.jpg",
    featured: false,
    genres: [16, 30, 18]
  },
  {
    title: "JoJo's Bizarre Adventure",
    description: "The story of the Joestar family, who are possessed with intense psychic strength, and the adventures each member encounters throughout their lives.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2012,
    rating: 8.6,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/3/40409.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/3/40409l.jpg",
    featured: false,
    genres: [16, 30, 18]
  },
  {
    title: "Dragon Ball",
    description: "Son Goku starts out as a young martial artist seeking his master's four-star Dragon Ball, and those who find all seven Dragon Balls can have any wish granted.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 1986,
    rating: 8.1,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1887/92364.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1887/92364l.jpg",
    featured: false,
    genres: [16, 30, 20]
  },
  {
    title: "My Dress-Up Darling",
    description: "A romantic comedy about a high school boy who makes traditional Japanese Hina dolls and a gyaru who has hidden interests in cosplay.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2022,
    rating: 8.4,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1179/119897.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1179/119897l.jpg",
    featured: false,
    genres: [21, 20, 24]
  },
  {
    title: "Fruits Basket",
    description: "After Tohru Honda is taken in by the Soma family, she learns that twelve family members transform involuntarily into animals of the Chinese zodiac and helps them deal with the emotional pain caused by the transformations.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2019,
    rating: 8.7,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1447/99827.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1447/99827l.jpg",
    featured: false,
    genres: [28, 21, 18]
  },
  {
    title: "86",
    description: "Officially, the Republic of San Magnolia is fending off attacks from the Empire's autonomous Legion with their own autonomous units, but in reality, they're using child soldiers known as 86.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2021,
    rating: 8.6,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1987/117507.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1987/117507l.jpg",
    featured: false,
    genres: [16, 25, 28]
  },
  {
    title: "Overlord",
    description: "A man finds himself reincarnated as his character in an MMORPG where the NPCs have gained sentience.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2015,
    rating: 8.1,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/7/88019.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/7/88019l.jpg",
    featured: false,
    genres: [16, 23, 18]
  },
  {
    title: "Blue Lock",
    description: "After a disastrous defeat at the 2018 World Cup, Japan's team struggles to regroup. But what's missing? An absolute Ace Striker, who can guide them to the win.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2022,
    rating: 8.3,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1783/138034.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1783/138034l.jpg",
    featured: false,
    genres: [17, 28, 19]
  },
  {
    title: "Bocchi the Rock!",
    description: "Hitori Gotou is a high school first-year who's bad at communicating with people. She'd been playing the guitar for six years, wanting to form a band because she thought it would make her life more interesting.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2022,
    rating: 8.9,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1448/127956.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1448/127956l.jpg",
    featured: false,
    genres: [20, 24]
  },
  {
    title: "Oshi no Ko",
    description: "A doctor and his recently-deceased patient are reborn as twins to a famous Japanese idol. Follow their journey through the dark side of the entertainment industry.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2023,
    rating: 8.9,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1812/134736.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1812/134736l.jpg",
    featured: true,
    genres: [28, 19, 18]
  },
  {
    title: "Frieren: Beyond Journey's End",
    description: "After the party of heroes defeated the Demon King, they restored peace to the land and returned to lives of solitude. The elven mage Frieren begins a journey to find former companions after the death of a friend.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2023,
    rating: 9.0,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg",
    featured: true,
    genres: [30, 23, 24]
  },
  {
    title: "Fairy Tail",
    description: "A celestial wizard joins a wizard guild to make a living, and meets friends while working through various magic adventures together.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2009,
    rating: 7.8,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/5/18179.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/5/18179l.jpg",
    featured: false,
    genres: [16, 30, 23]
  },
  {
    title: "Cyberpunk: Edgerunners",
    description: "In a dystopia overrun by corruption, crime, and cybernetic implants, an impulsive but talented street kid named David decides to become an edgerunner: a mercenary outlaw.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2022,
    rating: 8.6,
    duration: "25 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1818/126435.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1818/126435l.jpg",
    featured: false,
    genres: [16, 25, 19]
  },
  {
    title: "Kaguya-sama: Love is War",
    description: "Two students at the top of their prestigious academy try to force the other to confess their love first.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2019,
    rating: 8.7,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1295/106551.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1295/106551l.jpg",
    featured: false,
    genres: [20, 21, 19]
  },
  {
    title: "I Want to Eat Your Pancreas",
    description: "A high school student discovers one of his classmates, Sakura Yamauchi, is quietly suffering from a terminal pancreatic illness. They begin an unusual relationship that pulls them both out of their shells.",
    type: "Movie" as const,
    status: "Completed" as const,
    releaseYear: 2018,
    rating: 8.6,
    duration: "1 hr 48 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/11/93164.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/11/93164l.jpg",
    featured: false,
    genres: [28, 21]
  },
  {
    title: "Angel Beats!",
    description: "A group of teenagers, all of whom are dead, battle against the student council president Angel, to resist being obliterated for refusing to accept their deaths.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2010,
    rating: 8.1,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/10/22061.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/10/22061l.jpg",
    featured: false,
    genres: [28, 21, 18]
  },
  {
    title: "Erased",
    description: "A 29-year-old manga artist who can go back in time to save people's lives goes back to his elementary school days to prevent the kidnapping and murder of his classmates.",
    type: "TV" as const,
    status: "Completed" as const,
    releaseYear: 2016,
    rating: 8.5,
    duration: "23 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/10/77957.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/10/77957l.jpg",
    featured: false,
    genres: [22, 26, 19]
  },
  {
    title: "Suzume",
    description: "A teenage girl joins a mysterious young man to close doors that are releasing disasters all over Japan.",
    type: "Movie" as const,
    status: "Completed" as const,
    releaseYear: 2022,
    rating: 8.5,
    duration: "2 hr 2 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1598/128450.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1598/128450l.jpg",
    featured: false,
    genres: [28, 30, 23]
  },
  {
    title: "Dr. Stone",
    description: "After a mysterious event petrifies all humans on Earth, a scientifically minded teen awakes thousands of years later and uses his intellect to restore civilization.",
    type: "TV" as const,
    status: "Ongoing" as const,
    releaseYear: 2019,
    rating: 8.3,
    duration: "24 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1613/102576.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1613/102576l.jpg",
    featured: false,
    genres: [30, 25, 20]
  },
  {
    title: "Made in Abyss: Dawn of the Deep Soul",
    description: "The movie sequel to the Made in Abyss series. As the trio descends further and further, they encounter more dangerous creatures and treacherous environments.",
    type: "Movie" as const,
    status: "Completed" as const,
    releaseYear: 2020,
    rating: 8.7,
    duration: "1 hr 45 min",
    coverImage: "https://cdn.myanimelist.net/images/anime/1502/110723.jpg",
    bannerImage: "https://cdn.myanimelist.net/images/anime/1502/110723l.jpg",
    featured: false,
    genres: [30, 23, 22]
  }
];

// Add more animes up to 50 if needed
const additionalAnimeData = [
  // Generate additional anime entries as needed with randomized data
];

async function main() {
  try {
    console.log("Starting to add anime entries...");
    
    // Get existing anime count
    const existingAnimes = await db.select().from(animes);
    console.log(`Found ${existingAnimes.length} existing anime entries.`);
    
    // Set of existing anime titles to avoid duplicates
    const existingTitles = new Set(existingAnimes.map(anime => anime.title));
    
    // Filter out animes that already exist
    const filteredAnimeData = animeData.filter(anime => !existingTitles.has(anime.title));
    console.log(`Adding ${filteredAnimeData.length} new anime entries...`);
    
    for (const anime of filteredAnimeData) {
      // Extract genres and other data
      const { genres: genreIds, ...animeData } = anime;
      
      // Insert anime
      const [createdAnime] = await db.insert(animes).values(animeData).returning();
      console.log(`Added anime: ${createdAnime.title} (ID: ${createdAnime.id})`);
      
      // Insert genre relationships
      if (genreIds && genreIds.length > 0) {
        for (const genreId of genreIds) {
          await db.insert(animeGenres).values({
            animeId: createdAnime.id,
            genreId
          });
          console.log(`  - Added genre ID ${genreId} to anime ID ${createdAnime.id}`);
        }
      }
    }
    
    console.log("Finished adding anime entries.");
    
    // Get final count
    const updatedAnimes = await db.select().from(animes);
    console.log(`Total anime count: ${updatedAnimes.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error adding anime entries:", error);
    process.exit(1);
  }
}

main();