import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { eur } from "@/lib/utils";

export type RoomCardData = {
  slug: string;
  name: string;
  shortDescription: string;
  sizeSqm: number;
  bedConfig: string;
  view: string;
  maxGuests: number;
  baseRateCents: number;
  image: string;
};

export function RoomCard({ room }: { room: RoomCardData }) {
  return (
    <Link
      href={`/rooms/${room.slug}`}
      className="group block border border-parchment/10 bg-ink-soft transition-colors hover:border-brass/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={room.image}
          alt={`${room.name} at Hotel Transylvania`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-6">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-parchment-faint">
          {room.sizeSqm} m&sup2; &middot; {room.bedConfig} &middot; {room.view}
        </p>
        <h3 className="mt-2 font-display text-2xl font-medium text-parchment">
          {room.name}
        </h3>
        <p className="mt-2 line-clamp-2 font-sans text-[13px] leading-relaxed text-parchment-dim">
          {room.shortDescription}
        </p>
        <div className="mt-5 flex items-center justify-between">
          <p className="font-sans text-[13px] text-parchment-dim">
            From{" "}
            <span className="font-display text-lg text-parchment">
              {eur(room.baseRateCents)}
            </span>{" "}
            a night
          </p>
          <span className="flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-[0.14em] text-brass">
            View room
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
