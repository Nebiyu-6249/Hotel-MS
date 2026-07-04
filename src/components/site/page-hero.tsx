import Image from "next/image";
import { LedgerRule } from "@/components/site/ledger-rule";

// Compact title band used on interior pages. With an image it becomes a
// short visual header; without one it stays a quiet typographic block.
export function PageHero({
  eyebrow,
  title,
  lede,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  image?: string;
  imageAlt?: string;
}) {
  if (!image) {
    return (
      <section className="border-b border-parchment/10 py-16 md:py-20">
        <div className="site-container max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
            {title}
          </h1>
          {lede && (
            <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-parchment-dim">
              {lede}
            </p>
          )}
          <LedgerRule className="mt-8 w-40" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[340px] items-end overflow-hidden md:min-h-[420px]">
      <Image
        src={image}
        alt={imageAlt ?? ""}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/15" aria-hidden />
      <div className="site-container relative pb-12 pt-32">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-medium leading-tight sm:text-5xl">
          {title}
        </h1>
        {lede && (
          <p className="mt-4 max-w-2xl font-sans text-[15px] leading-relaxed text-parchment-dim">
            {lede}
          </p>
        )}
      </div>
    </section>
  );
}
