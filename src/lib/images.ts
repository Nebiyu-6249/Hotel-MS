// Placeholder photography, served from Unsplash under the Unsplash License
// (free for commercial use, no attribution required). Every image on the site
// resolves through this file or through seeded database rows that import it,
// so swapping in the property's own photography means editing one file and
// re-seeding.

const u = (id: string, w = 1800) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const IMAGES = {
  // Exteriors and grounds
  hero: u("photo-1733667917612-319793fc3f7b", 2400),
  exteriorRidge: u("photo-1512424113276-fa9f6a112384"),
  exteriorHilltop: u("photo-1696096350624-f48337077719"),
  exteriorForest: u("photo-1719239947203-9490921af673"),
  exteriorFacade: u("photo-1571993428915-d5e2f1f13d5f"),
  exteriorCliff: u("photo-1757692236286-3fc7ab66b05b"),
  stoneWall: u("photo-1689253790934-efb4831df6c2"),
  stoneLane: u("photo-1719411236511-3d7878ad2aec"),

  // Rooms
  roomCourtyard1: u("photo-1656789280583-e06c4f88f8eb"),
  roomCourtyard2: u("photo-1776763255197-495b343d5a33"),
  roomForest1: u("photo-1729605412224-147d072d3667"),
  roomForest2: u("photo-1629140727571-9b5c6f6267b4"),
  roomLibrary1: u("photo-1666813721996-42956e40788e"),
  roomLibrary2: u("photo-1731336478850-6bce7235e320"),
  roomTower1: u("photo-1552858725-693709cc17c7"),
  roomTower2: u("photo-1552858725-a19e7fcd3ac4"),
  roomApartment1: u("photo-1588861424526-28303cffbdd4"),
  roomApartment2: u("photo-1742039953129-e4edcc82d319"),
  roomDetail: u("photo-1776763255122-3d35e32aee64"),
  roomAccent: u("photo-1777170191230-3f357b815483"),

  // Dining and bar
  diningTable: u("photo-1536392706976-e486e2ba97af"),
  diningPlates: u("photo-1562050344-f7ad946cee35"),
  diningSetting: u("photo-1615500025837-cf3a8716c83d"),
  diningService: u("photo-1581954548122-4dff8989c0f7"),
  diningCandles: u("photo-1688437307687-fe226bddfab1"),
  diningDish: u("photo-1609058620405-917e2c967d57"),
  diningWine: u("photo-1605984591610-f9939dc688a9"),
  barGlass: u("photo-1628417143488-11cf36a6f81b"),
  wineGlassLow: u("photo-1519756719377-e084f8333a83"),

  // Events, celebrations, packages
  eventsLongTable: u("photo-1463183547458-6a2c760d0912"),
  eventsFlowers: u("photo-1740120424442-ccd013ec9581"),
  eventsToast: u("photo-1471967183320-ee018f6e114a"),
  honeymoonCandle: u("photo-1562050147-fda1cc9a6378"),
  weddingRoses: u("photo-1529516222410-a269d812f320"),

  // Lounge
  fireplaceLounge: u("photo-1761319914911-71b059a655d8"),
} as const;

export type ImageKey = keyof typeof IMAGES;
