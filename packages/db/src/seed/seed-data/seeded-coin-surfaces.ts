import type { SeededCoinSurface } from "./types"

export const seededCoinSurfaces: SeededCoinSurface[] = [
  {
    coinTitle: "Spain 2 Euro",
    kind: "obverse",
    description: "Portrait of Felipe VI facing left.",
    lettering: "FELIPE VI REY DE ESPANA",
    thumbnailUrl: "http://localhost:3000/placeholder-coin.svg",
    imageUrl: "http://localhost:3000/placeholder-coin.svg",
  },
  {
    coinTitle: "Spain 2 Euro",
    kind: "reverse",
    description: "Map of Europe with denomination.",
    lettering: "2 EURO",
    thumbnailUrl: "http://localhost:3000/placeholder-coin.svg",
    imageUrl: "http://localhost:3000/placeholder-coin.svg",
  },
  {
    coinTitle: "Spain 2 Euro",
    kind: "edge-surface",
    description: "Finely reeded with incuse lettering.",
    lettering: "2 **",
    thumbnailUrl: "http://localhost:3000/placeholder-coin.svg",
    imageUrl: "http://localhost:3000/placeholder-coin.svg",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    kind: "obverse",
    description:
      'A stylised pillar from which the sprouts grow upwards with the sprouts representing the enlargement of the European Union and the pillar representing the foundation for growth with the letters "EU" to the left of the pillar, and the date at the top in the outer ring along with the twelve stars of Europe',
    lettering: "2004 EU M M",
    thumbnailUrl: "http://localhost:3000/finland-2-euro-2004-obverse.jpg",
    imageUrl: "http://localhost:3000/finland-2-euro-2004-obverse.jpg",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    kind: "reverse",
    description:
      "A map, next to the face value, shows the European continent without borders",
    lettering: "2 EURO LL",
    thumbnailUrl: "http://localhost:3000/finland-2-euro-2004-reverse.jpg",
    imageUrl: "http://localhost:3000/finland-2-euro-2004-reverse.jpg",
  },
]
