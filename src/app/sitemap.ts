import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/rooms",
    "/amenities",
    "/dining",
    "/gallery",
    "/offers",
    "/events",
    "/about",
    "/contact",
    "/book",
    "/policies",
    "/privacy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const rooms = await prisma.roomType.findMany({
    where: { active: true },
    select: { slug: true },
  });

  return [
    ...staticPages,
    ...rooms.map((room) => ({
      url: `${BASE}/rooms/${room.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
