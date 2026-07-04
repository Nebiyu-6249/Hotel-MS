import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CookieBanner } from "@/components/site/cookie-banner";
import { MobileBookBar } from "@/components/site/mobile-book-bar";

// Rendered per request: prices, availability and admin-edited content change
// constantly, and this also keeps `next build` from needing a live database.
// Once content stabilizes, individual pages can opt back into ISR.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, roomTypes] = await Promise.all([
    getSettings(),
    prisma.roomType.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-ink text-parchment">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-brass focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <SiteHeader roomTypes={roomTypes} bestRateNote={settings.best_rate_note} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <MobileBookBar roomTypes={roomTypes} />
      <CookieBanner />
    </div>
  );
}
