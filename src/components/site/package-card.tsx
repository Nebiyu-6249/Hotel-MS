import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eur } from "@/lib/utils";

export type PackageCardData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  inclusions: string[];
  priceCents: number;
  priceNote: string;
  image: string;
};

export function PackageCard({ pack }: { pack: PackageCardData }) {
  return (
    <article className="flex h-full flex-col border border-parchment/10 bg-ink-soft">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={pack.image}
          alt={pack.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-medium text-parchment">
          {pack.name}
        </h3>
        <p className="mt-1 font-sans text-[12px] uppercase tracking-[0.16em] text-brass">
          {pack.tagline}
        </p>
        <p className="mt-3 font-sans text-[13px] leading-relaxed text-parchment-dim">
          {pack.description}
        </p>
        <ul className="mt-4 space-y-2">
          {pack.inclusions.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 font-sans text-[13px] text-parchment-dim"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-parchment/10 pt-5">
          <p className="font-sans text-[12px] text-parchment-faint">
            <span className="block font-display text-2xl text-parchment">
              {eur(pack.priceCents)}
            </span>
            {pack.priceNote}
          </p>
          <Button asChild variant="brass" size="sm">
            <Link href="/book">Check Availability</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
