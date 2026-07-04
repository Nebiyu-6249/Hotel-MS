/**
 * Seeds the database with the full property setup: staff accounts, the five
 * room types and their 26 physical rooms, pricing rules, add-ons, packages,
 * gallery, reviews, and a spread of bookings around today so the back office
 * opens with live-looking arrivals, departures, in-house stays and reports.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient, type BookingSource, type BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { IMAGES } from "../src/lib/images";

const prisma = new PrismaClient();

// ---------- date helpers (UTC-midnight dates, matching the app) ----------

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nightlyRates(checkIn: Date, checkOut: Date, rateCents: number) {
  const nights: { date: string; rateCents: number }[] = [];
  for (let d = new Date(checkIn); d < checkOut; d = addDays(d, 1)) {
    nights.push({ date: toDateString(d), rateCents });
  }
  return nights;
}

let referenceCounter = 0;
function reference(): string {
  // Stable, readable references for seeded data: HT-SEED01, HT-SEED02...
  referenceCounter += 1;
  return `HT-SEED${String(referenceCounter).padStart(2, "0")}`;
}

async function main() {
  const today = todayUtc();

  // ---------- wipe (order matters for foreign keys) ----------
  await prisma.bookingAddOn.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.housekeepingTask.deleteMany();
  await prisma.roomBlock.deleteMany();
  await prisma.room.deleteMany();
  await prisma.rateRule.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.addOn.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.review.deleteMany();
  await prisma.package.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.eventInquiry.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // ---------- staff ----------
  const hash = (password: string) => bcrypt.hashSync(password, 12);
  const [, , , housekeeper] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Ana Munteanu",
        email: "owner@hoteltransylvania.ro",
        passwordHash: hash("owner-castle-1867"),
        role: "OWNER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Radu Ionescu",
        email: "manager@hoteltransylvania.ro",
        passwordHash: hash("manager-castle-1867"),
        role: "MANAGER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Ioana Petrescu",
        email: "frontdesk@hoteltransylvania.ro",
        passwordHash: hash("frontdesk-castle-1867"),
        role: "FRONT_DESK",
      },
    }),
    prisma.user.create({
      data: {
        name: "Maria Stan",
        email: "housekeeping@hoteltransylvania.ro",
        passwordHash: hash("housekeeping-castle-1867"),
        role: "HOUSEKEEPING",
      },
    }),
  ]);

  // ---------- room types ----------
  const courtyard = await prisma.roomType.create({
    data: {
      slug: "courtyard-room",
      name: "Courtyard Room",
      shortDescription:
        "A quiet double over the cobbled courtyard, with the original beamed ceiling overhead.",
      description:
        "The Courtyard Rooms sit along the inner wall of the castle, one floor above the fountain. They are the rooms the house staff quietly prefer: away from the road, warm early in the morning, and small enough that the fireplace heat reaches every corner.\n\nEach room keeps its 19th century beamed ceiling and deep window seat. The bathroom is fully modern, with underfloor heating and a rain shower.",
      sizeSqm: 24,
      bedConfig: "Queen bed",
      view: "Courtyard view",
      maxGuests: 2,
      baseRateCents: 18000,
      images: [IMAGES.roomCourtyard1, IMAGES.roomCourtyard2, IMAGES.roomDetail],
      amenities: [
        "Queen bed with wool duvet",
        "Rain shower with underfloor heating",
        "Original beamed ceiling",
        "Window seat over the courtyard",
        "Nespresso machine and local teas",
        "Free wifi",
      ],
      featured: false,
      sortOrder: 1,
    },
  });

  const forest = await prisma.roomType.create({
    data: {
      slug: "forest-room",
      name: "Forest Room",
      shortDescription:
        "Wake to spruce forest filling the window. Our most booked room, for a reason.",
      description:
        "The Forest Rooms line the north wing, and every one of them looks straight into the old spruce stand behind the castle. In autumn the fog sits in the trees until ten in the morning; in winter you can watch deer cross the clearing from bed.\n\nThese rooms are a step larger than the Courtyard Rooms, with a reading chair by the window and a proper writing desk.",
      sizeSqm: 28,
      bedConfig: "King bed",
      view: "Forest view",
      maxGuests: 2,
      baseRateCents: 22000,
      images: [IMAGES.roomForest1, IMAGES.roomForest2, IMAGES.roomAccent],
      amenities: [
        "King bed with wool duvet",
        "Floor-to-ceiling forest window",
        "Reading chair and writing desk",
        "Walk-in rain shower",
        "Nespresso machine and local teas",
        "Free wifi",
      ],
      featured: true,
      sortOrder: 2,
    },
  });

  const library = await prisma.roomType.create({
    data: {
      slug: "library-suite",
      name: "Library Suite",
      shortDescription:
        "A separate sitting room walled in books, with a wood-burning fireplace between the shelves.",
      description:
        "The Library Suites were built out of the castle's original private study and its adjoining chambers. Each suite has a separate sitting room lined floor to ceiling with books gathered over a century, and a wood-burning fireplace the staff lay for you each evening.\n\nThe bedroom sits behind a heavy oak door, so one of you can read late while the other sleeps.",
      sizeSqm: 42,
      bedConfig: "King bed, separate sitting room",
      view: "Village and hills",
      maxGuests: 3,
      baseRateCents: 34000,
      images: [IMAGES.roomLibrary1, IMAGES.roomLibrary2, IMAGES.fireplaceLounge],
      amenities: [
        "Separate book-lined sitting room",
        "Wood-burning fireplace, laid nightly",
        "King bed behind a soundproof oak door",
        "Soaking tub and separate shower",
        "Daybed sleeps a third guest",
        "Evening turndown with mulled wine in winter",
      ],
      featured: true,
      sortOrder: 3,
    },
  });

  const tower = await prisma.roomType.create({
    data: {
      slug: "tower-suite",
      name: "Tower Suite",
      shortDescription:
        "The top two floors of the west tower, with 360-degree views over the Carpathian foothills.",
      description:
        "There are only three tower suites, one per tower, and each takes the top two floors: a stone-walled sitting room below, a bedroom above reached by the original spiral stair. Windows face all four directions, so you get sunrise over the ridge and sunset over the village.\n\nThis is the room people book for anniversaries and proposals. Book the winter months early.",
      sizeSqm: 48,
      bedConfig: "King bed, duplex layout",
      view: "Panoramic mountain view",
      maxGuests: 2,
      baseRateCents: 42000,
      images: [IMAGES.roomTower1, IMAGES.roomTower2, IMAGES.exteriorRidge],
      amenities: [
        "Private duplex across two tower floors",
        "Windows on all four sides",
        "Original spiral stone staircase",
        "Freestanding tub with a mountain view",
        "Champagne on arrival",
        "Priority booking at Restaurant Vatra",
      ],
      featured: true,
      sortOrder: 4,
    },
  });

  const apartment = await prisma.roomType.create({
    data: {
      slug: "carpathian-apartment",
      name: "Carpathian Apartment",
      shortDescription:
        "A full apartment with kitchen, dining room and two bedrooms. Built for families and long stays.",
      description:
        "The two Carpathian Apartments occupy the former staff quarters along the south wall, rebuilt as self-contained homes: a farmhouse kitchen, a dining table for six, a living room with a wood stove, and two proper bedrooms.\n\nFamilies take them for a week at a time. The kitchen comes stocked with breakfast basics from the village, and the housekeeping team can arrange a cook for dinner with a day's notice.",
      sizeSqm: 65,
      bedConfig: "King bed plus twin room",
      view: "Garden and orchard",
      maxGuests: 5,
      baseRateCents: 52000,
      images: [IMAGES.roomApartment1, IMAGES.roomApartment2, IMAGES.stoneLane],
      amenities: [
        "Full farmhouse kitchen, breakfast basics stocked",
        "Dining table for six",
        "Wood stove in the living room",
        "Two bedrooms and two bathrooms",
        "Washer and dryer",
        "Private cook available on request",
      ],
      featured: false,
      sortOrder: 5,
    },
  });

  // ---------- physical rooms (26 units) ----------
  const roomPlan: { type: { id: string }; numbers: string[]; floor: number }[] = [
    { type: courtyard, numbers: ["101", "102", "103", "104"], floor: 1 },
    { type: courtyard, numbers: ["201", "202", "203", "204"], floor: 2 },
    { type: forest, numbers: ["111", "112", "113", "114"], floor: 1 },
    { type: forest, numbers: ["211", "212", "213", "214"], floor: 2 },
    { type: library, numbers: ["221", "222", "223"], floor: 2 },
    { type: library, numbers: ["321", "322"], floor: 3 },
    { type: tower, numbers: ["301", "302", "303"], floor: 3 },
    { type: apartment, numbers: ["001", "002"], floor: 0 },
  ];
  const rooms: Record<string, { id: string }> = {};
  for (const group of roomPlan) {
    for (const number of group.numbers) {
      rooms[number] = await prisma.room.create({
        data: { number, floor: group.floor, roomTypeId: group.type.id },
      });
    }
  }

  // ---------- rate rules ----------
  const year = today.getUTCFullYear();
  await prisma.rateRule.createMany({
    data: [
      {
        name: "Summer season",
        kind: "MULTIPLIER",
        value: 125, // base +25%
        startDate: new Date(Date.UTC(year, 5, 15)), // Jun 15
        endDate: new Date(Date.UTC(year, 8, 15)), // Sep 15
        priority: 10,
        active: true,
      },
      {
        name: "Weekend nights",
        kind: "MULTIPLIER",
        value: 110, // base +10%
        startDate: new Date(Date.UTC(year, 0, 1)),
        endDate: new Date(Date.UTC(year, 11, 31)),
        priority: 1,
        active: false, // off by default; a switch the manager can flip
      },
      {
        name: "Christmas week, Tower Suite",
        kind: "FIXED",
        value: 56000, // EUR 560 per night
        startDate: new Date(Date.UTC(year, 11, 20)),
        endDate: new Date(Date.UTC(year, 11, 31)),
        priority: 20,
        active: true,
        roomTypeId: tower.id,
      },
    ],
  });

  // ---------- add-ons ----------
  const breakfast = await prisma.addOn.create({
    data: {
      slug: "breakfast",
      name: "Breakfast at Vatra",
      description:
        "The full farmhouse breakfast: eggs from the village, smoked trout, fresh bread, mountain honey.",
      priceCents: 1800,
      pricing: "PER_GUEST_NIGHT",
      sortOrder: 1,
    },
  });
  const transfer = await prisma.addOn.create({
    data: {
      slug: "airport-transfer",
      name: "Airport transfer",
      description:
        "Private car from Brasov-Ghimbav airport, about 40 minutes. One transfer each way.",
      priceCents: 9000,
      pricing: "PER_BOOKING",
      sortOrder: 2,
    },
  });
  await prisma.addOn.create({
    data: {
      slug: "late-checkout",
      name: "Late checkout until 15:00",
      description: "Keep the room until three in the afternoon, subject to arrival that day.",
      priceCents: 6000,
      pricing: "PER_BOOKING",
      sortOrder: 3,
    },
  });
  await prisma.addOn.create({
    data: {
      slug: "firewood-wine",
      name: "Fireside evening set",
      description:
        "Extra firewood, a bottle of Feteasca Neagra and a board of local cheese, brought to the room each evening.",
      priceCents: 4500,
      pricing: "PER_NIGHT",
      sortOrder: 4,
    },
  });

  // ---------- packages ----------
  await prisma.package.createMany({
    data: [
      {
        slug: "winter-by-the-fire",
        name: "Winter by the Fire",
        tagline: "Three nights in a Library Suite while the snow does its work outside.",
        description:
          "Three nights in a Library Suite with the fireplace laid every evening, breakfast for two each morning, one dinner at Restaurant Vatra, and the fireside evening set on your first night.",
        inclusions: [
          "Three nights in a Library Suite",
          "Fireplace laid nightly by the house staff",
          "Breakfast for two, every morning",
          "One three-course dinner at Restaurant Vatra",
          "Fireside evening set on arrival night",
        ],
        priceCents: 118000,
        priceNote: "per stay for two",
        image: IMAGES.fireplaceLounge,
        sortOrder: 1,
      },
      {
        slug: "honeymoon-in-the-hills",
        name: "Honeymoon in the Hills",
        tagline: "The Tower Suite, champagne, and nobody to answer to for two days.",
        description:
          "Two nights in a Tower Suite with champagne on arrival, breakfast delivered up the spiral stair each morning, a private dinner for two in the cellar, and late checkout on your last day.",
        inclusions: [
          "Two nights in a Tower Suite",
          "Champagne and flowers on arrival",
          "Breakfast delivered to the suite",
          "Private cellar dinner for two",
          "Late checkout until 15:00",
        ],
        priceCents: 104000,
        priceNote: "per stay for two",
        image: IMAGES.honeymoonCandle,
        sortOrder: 2,
      },
      {
        slug: "chefs-table-weekend",
        name: "Chef's Table Weekend",
        tagline: "Two nights built around six courses at the kitchen's own table.",
        description:
          "Two nights in a Forest Room, the chef's table tasting menu with wine pairings on Saturday evening, breakfast both mornings, and a morning walk with the kitchen team to the village smokehouse.",
        inclusions: [
          "Two nights in a Forest Room",
          "Six-course chef's table with wine pairings",
          "Breakfast both mornings",
          "Smokehouse walk with the kitchen team",
        ],
        priceCents: 76000,
        priceNote: "per stay for two",
        image: IMAGES.diningPlates,
        sortOrder: 3,
      },
    ],
  });

  // ---------- gallery ----------
  await prisma.galleryImage.createMany({
    data: [
      { url: IMAGES.hero, alt: "The castle at dusk with lit windows", category: "GROUNDS", sortOrder: 1 },
      { url: IMAGES.exteriorRidge, alt: "Castle on the ridge above the valley", category: "GROUNDS", sortOrder: 2 },
      { url: IMAGES.exteriorForest, alt: "The north wall against the spruce forest", category: "GROUNDS", sortOrder: 3 },
      { url: IMAGES.exteriorFacade, alt: "Stone facade and entrance gate", category: "GROUNDS", sortOrder: 4 },
      { url: IMAGES.stoneWall, alt: "Original stone wall detail", category: "GROUNDS", sortOrder: 5 },
      { url: IMAGES.stoneLane, alt: "Cobbled lane along the south wall", category: "GROUNDS", sortOrder: 6 },
      { url: IMAGES.roomForest1, alt: "Forest Room with a view into the spruce stand", category: "ROOMS", sortOrder: 1 },
      { url: IMAGES.roomLibrary1, alt: "Library Suite sitting room with fireplace", category: "ROOMS", sortOrder: 2 },
      { url: IMAGES.roomTower1, alt: "Tower Suite bedroom at the top of the spiral stair", category: "ROOMS", sortOrder: 3 },
      { url: IMAGES.roomCourtyard1, alt: "Courtyard Room with beamed ceiling", category: "ROOMS", sortOrder: 4 },
      { url: IMAGES.roomApartment1, alt: "Carpathian Apartment living room", category: "ROOMS", sortOrder: 5 },
      { url: IMAGES.diningTable, alt: "Restaurant Vatra dining room by candlelight", category: "DINING", sortOrder: 1 },
      { url: IMAGES.diningPlates, alt: "Tasting course at Restaurant Vatra", category: "DINING", sortOrder: 2 },
      { url: IMAGES.diningWine, alt: "Wine service in the cellar bar", category: "DINING", sortOrder: 3 },
      { url: IMAGES.eventsLongTable, alt: "Long table set for a wedding dinner", category: "EVENTS", sortOrder: 1 },
      { url: IMAGES.eventsToast, alt: "Evening toast on the terrace", category: "EVENTS", sortOrder: 2 },
    ],
  });

  // ---------- reviews ----------
  await prisma.review.createMany({
    data: [
      {
        guestName: "Claire and Tom H.",
        location: "London, UK",
        rating: 5,
        title: "The fireplace alone is worth the trip",
        body: "We took a Library Suite for four nights in November. Every evening the fire was laid before we got back from dinner. Staff remembered everything we mentioned once. The drive up is winding but that is rather the point.",
        stayedAt: addDays(today, -140),
        status: "APPROVED",
        featured: true,
      },
      {
        guestName: "Andrei P.",
        location: "Bucharest, Romania",
        rating: 5,
        title: "Best breakfast in the county",
        body: "I grew up an hour from here and still learned things about the region from the kitchen team. The smoked trout at breakfast is from the village. Rooms are warm, wifi is quick, nobody bothers you.",
        stayedAt: addDays(today, -95),
        status: "APPROVED",
        featured: true,
      },
      {
        guestName: "Sofia M.",
        location: "Milan, Italy",
        rating: 5,
        title: "Proposed in the Tower Suite",
        body: "She said yes at sunrise with the fog still in the valley. The team had champagne up the spiral stair before we had even called down. We will be back every year.",
        stayedAt: addDays(today, -60),
        status: "APPROVED",
        featured: true,
      },
      {
        guestName: "Jonas K.",
        location: "Berlin, Germany",
        rating: 4,
        title: "Quiet, dark, wonderful",
        body: "Came to finish a manuscript and got exactly the silence I paid for. One star withheld because the cellar bar closes at midnight and I was not done.",
        stayedAt: addDays(today, -45),
        status: "APPROVED",
      },
      {
        guestName: "The Radulescu family",
        location: "Cluj-Napoca, Romania",
        rating: 5,
        title: "A week in the apartment with three kids",
        body: "The Carpathian Apartment swallowed our family whole. Kitchen stocked on arrival, washer for the muddy clothes, and the staff treated the kids like small royalty. Genuinely did not want to leave.",
        stayedAt: addDays(today, -30),
        status: "APPROVED",
      },
      {
        guestName: "Marta W.",
        location: "Warsaw, Poland",
        rating: 5,
        title: "Autumn fog and good wine",
        body: "The forest view rooms are the ones to book. Fog in the spruce until mid-morning, then walking trails straight from the gate. Dinner at Vatra twice, both excellent.",
        stayedAt: addDays(today, -12),
        status: "PENDING",
      },
      {
        guestName: "Daniel O.",
        location: "Dublin, Ireland",
        rating: 4,
        title: "Great stay, book the transfer",
        body: "Everything inside the walls is superb. Just take the hotel transfer instead of a taxi from the airport; ours got lost twice on the mountain road.",
        stayedAt: addDays(today, -8),
        status: "PENDING",
      },
    ],
  });

  // ---------- guests ----------
  async function guest(
    firstName: string,
    lastName: string,
    email: string,
    extras: { phone?: string; country?: string; notes?: string; marketingConsent?: boolean } = {}
  ) {
    return prisma.guest.create({
      data: { firstName, lastName, email, ...extras },
    });
  }

  const gClaire = await guest("Claire", "Howard", "claire.howard@example.com", {
    phone: "+44 7700 900123",
    country: "United Kingdom",
    marketingConsent: true,
    notes: "Repeat guest. Prefers the quiet wing, always books a Library Suite.",
  });
  const gAndrei = await guest("Andrei", "Popescu", "andrei.popescu@example.com", {
    phone: "+40 722 000 111",
    country: "Romania",
    marketingConsent: true,
  });
  const gSofia = await guest("Sofia", "Moretti", "sofia.moretti@example.com", {
    country: "Italy",
    notes: "Engaged here. Anniversary around this date each year.",
  });
  const gJonas = await guest("Jonas", "Keller", "jonas.keller@example.com", {
    country: "Germany",
  });
  const gElena = await guest("Elena", "Radulescu", "elena.radulescu@example.com", {
    phone: "+40 733 222 333",
    country: "Romania",
    notes: "Family of five, needs the apartment and a crib.",
  });
  const gMarta = await guest("Marta", "Wojcik", "marta.wojcik@example.com", {
    country: "Poland",
    marketingConsent: true,
  });
  const gDaniel = await guest("Daniel", "OBrien", "daniel.obrien@example.com", {
    country: "Ireland",
  });
  const gYuki = await guest("Yuki", "Tanaka", "yuki.tanaka@example.com", {
    country: "Japan",
  });

  // ---------- bookings ----------
  // VAT rate matches SETTING_DEFAULTS (9%).
  const TAX = 9;

  async function booking(options: {
    guestId: string;
    roomType: { id: string };
    baseRateCents: number;
    checkInOffset: number;
    nights: number;
    status: BookingStatus;
    source?: BookingSource;
    adults?: number;
    children?: number;
    assignedRoom?: string;
    breakfastGuests?: number; // adds breakfast for N guests
    airportTransfer?: boolean;
    specialRequests?: string;
    cancellationReason?: string;
    paidOnline?: boolean;
    createdDaysAgo?: number;
  }) {
    const checkIn = addDays(today, options.checkInOffset);
    const checkOut = addDays(checkIn, options.nights);
    const rates = nightlyRates(checkIn, checkOut, options.baseRateCents);
    const subtotalCents = rates.reduce((sum, night) => sum + night.rateCents, 0);

    let addOnsCents = 0;
    const addOnLines: { addOnId: string; quantity: number; totalCents: number }[] = [];
    if (options.breakfastGuests) {
      const total = breakfast.priceCents * options.breakfastGuests * options.nights;
      addOnLines.push({
        addOnId: breakfast.id,
        quantity: options.breakfastGuests * options.nights,
        totalCents: total,
      });
      addOnsCents += total;
    }
    if (options.airportTransfer) {
      addOnLines.push({ addOnId: transfer.id, quantity: 1, totalCents: transfer.priceCents });
      addOnsCents += transfer.priceCents;
    }

    const taxCents = Math.round(((subtotalCents + addOnsCents) * TAX) / 100);
    const ref = reference();
    const created = await prisma.booking.create({
      data: {
        reference: ref,
        roomTypeId: options.roomType.id,
        guestId: options.guestId,
        checkIn,
        checkOut,
        adults: options.adults ?? 2,
        children: options.children ?? 0,
        status: options.status,
        source: options.source ?? "WEBSITE",
        nightlyRates: rates,
        subtotalCents,
        addOnsCents,
        taxCents,
        totalCents: subtotalCents + addOnsCents + taxCents,
        assignedRoomId: options.assignedRoom ? rooms[options.assignedRoom].id : null,
        specialRequests: options.specialRequests,
        cancellationReason: options.cancellationReason,
        cancelledAt: options.status === "CANCELLED" ? addDays(today, -2) : null,
        stripePaymentIntentId: options.paidOnline
          ? `pi_seed_${ref.toLowerCase()}`
          : null,
        createdAt: addDays(today, -(options.createdDaysAgo ?? 7)),
        addOns: addOnLines.length ? { create: addOnLines } : undefined,
      },
    });
    return created;
  }

  // Past stays (history for reports and guest profiles)
  await booking({
    guestId: gClaire.id, roomType: library, baseRateCents: 34000,
    checkInOffset: -20, nights: 4, status: "CHECKED_OUT",
    breakfastGuests: 2, paidOnline: true, createdDaysAgo: 45,
  });
  await booking({
    guestId: gAndrei.id, roomType: forest, baseRateCents: 22000,
    checkInOffset: -14, nights: 2, status: "CHECKED_OUT",
    breakfastGuests: 2, paidOnline: true, createdDaysAgo: 30,
  });
  await booking({
    guestId: gElena.id, roomType: apartment, baseRateCents: 52000,
    checkInOffset: -10, nights: 7, status: "CHECKED_OUT",
    adults: 2, children: 3, source: "PHONE", createdDaysAgo: 60,
    specialRequests: "Crib for the youngest, ground floor if possible.",
  });
  await booking({
    guestId: gJonas.id, roomType: courtyard, baseRateCents: 18000,
    checkInOffset: -6, nights: 3, status: "NO_SHOW",
    paidOnline: true, createdDaysAgo: 20,
  });
  await booking({
    guestId: gDaniel.id, roomType: forest, baseRateCents: 22000,
    checkInOffset: -3, nights: 2, status: "CANCELLED",
    paidOnline: true, createdDaysAgo: 15,
    cancellationReason: "Guest illness, refunded in full.",
  });

  // In house right now (checked in yesterday, leaves in two days)
  await booking({
    guestId: gSofia.id, roomType: tower, baseRateCents: 42000,
    checkInOffset: -1, nights: 3, status: "CHECKED_IN",
    assignedRoom: "301", breakfastGuests: 2, airportTransfer: true,
    paidOnline: true, createdDaysAgo: 25,
    specialRequests: "Anniversary of our engagement here. Champagne if possible.",
  });
  await prisma.room.update({ where: { number: "301" }, data: { status: "OCCUPIED" } });

  // Departing today
  await booking({
    guestId: gMarta.id, roomType: forest, baseRateCents: 22000,
    checkInOffset: -2, nights: 2, status: "CHECKED_IN",
    assignedRoom: "211", breakfastGuests: 1, paidOnline: true, createdDaysAgo: 12,
  });
  await prisma.room.update({ where: { number: "211" }, data: { status: "OCCUPIED" } });

  // Arriving today (the front desk has a check-in to do)
  await booking({
    guestId: gYuki.id, roomType: library, baseRateCents: 34000,
    checkInOffset: 0, nights: 3, status: "CONFIRMED",
    assignedRoom: "221", breakfastGuests: 2, airportTransfer: true,
    paidOnline: true, createdDaysAgo: 18,
    specialRequests: "Arriving on the evening flight, expect us around 21:00.",
  });

  // Future bookings
  await booking({
    guestId: gClaire.id, roomType: library, baseRateCents: 34000,
    checkInOffset: 9, nights: 4, status: "CONFIRMED",
    breakfastGuests: 2, paidOnline: true, createdDaysAgo: 5,
  });
  await booking({
    guestId: gAndrei.id, roomType: courtyard, baseRateCents: 18000,
    checkInOffset: 5, nights: 2, status: "CONFIRMED",
    source: "PHONE", createdDaysAgo: 3,
  });
  await booking({
    guestId: gDaniel.id, roomType: tower, baseRateCents: 42000,
    checkInOffset: 14, nights: 2, status: "CONFIRMED",
    breakfastGuests: 2, paidOnline: true, createdDaysAgo: 1,
  });

  // ---------- housekeeping ----------
  await prisma.room.update({ where: { number: "112" }, data: { status: "DIRTY" } });
  await prisma.room.update({ where: { number: "203" }, data: { status: "MAINTENANCE" } });

  await prisma.housekeepingTask.createMany({
    data: [
      {
        roomId: rooms["112"].id,
        title: "Full turnover after checkout",
        notes: "Guest left early, room free to clean now.",
        status: "OPEN",
        assigneeId: housekeeper.id,
        dueDate: today,
      },
      {
        roomId: rooms["203"].id,
        title: "Radiator valve leaking",
        notes: "Plumber booked for Thursday morning. Keep off sale until then.",
        status: "IN_PROGRESS",
        dueDate: addDays(today, 2),
      },
      {
        roomId: rooms["301"].id,
        title: "Anniversary setup for tonight",
        notes: "Champagne, flowers, extra firewood before the guests return from dinner.",
        status: "OPEN",
        assigneeId: housekeeper.id,
        dueDate: today,
      },
    ],
  });

  // Room 203 blocked while the radiator is fixed
  await prisma.roomBlock.create({
    data: {
      roomId: rooms["203"].id,
      startDate: today,
      endDate: addDays(today, 3),
      reason: "Radiator repair",
    },
  });

  // ---------- inbox ----------
  await prisma.eventInquiry.create({
    data: {
      name: "Ioana and Mihai",
      email: "ioana.vlad@example.com",
      phone: "+40 744 555 666",
      eventType: "Wedding",
      eventDate: addDays(today, 90),
      guestCount: 80,
      message:
        "We are looking at a September wedding for around 80 guests, ceremony in the courtyard and dinner in the great hall. Could we come for a viewing in the next two weeks?",
    },
  });

  await prisma.contactMessage.create({
    data: {
      name: "Peter Lang",
      email: "peter.lang@example.com",
      subject: "Dog policy",
      message:
        "We would love to bring our very calm golden retriever for a three night stay in October. Which rooms allow dogs and is there a fee?",
    },
  });

  console.log("Seed complete.");
  console.log("Staff logins (email / password):");
  console.log("  owner@hoteltransylvania.ro / owner-castle-1867");
  console.log("  manager@hoteltransylvania.ro / manager-castle-1867");
  console.log("  frontdesk@hoteltransylvania.ro / frontdesk-castle-1867");
  console.log("  housekeeping@hoteltransylvania.ro / housekeeping-castle-1867");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
