"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  id: string;
  url: string;
  alt: string;
  category: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  ROOMS: "Rooms",
  GROUNDS: "Grounds",
  DINING: "Dining",
  EVENTS: "Events",
};

export function GalleryGrid({
  items,
  withTabs = true,
}: {
  items: GalleryItem[];
  withTabs?: boolean;
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const visible =
    filter === "ALL" ? items : items.filter((i) => i.category === filter);
  const current = openIndex !== null ? visible[openIndex] : null;

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((idx) => {
        if (idx === null) return idx;
        return (idx + delta + visible.length) % visible.length;
      });
    },
    [visible.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, step]);

  return (
    <div>
      {withTabs && categories.length > 1 && (
        <div
          className="mb-8 flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label="Gallery categories"
        >
          {["ALL", ...categories].map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={filter === cat}
              onClick={() => {
                setFilter(cat);
                setOpenIndex(null);
              }}
              className={cn(
                "border px-4 py-2 font-sans text-[12px] uppercase tracking-[0.16em] transition-colors",
                filter === cat
                  ? "border-brass text-brass"
                  : "border-parchment/20 text-parchment-dim hover:border-parchment/50 hover:text-parchment"
              )}
            >
              {cat === "ALL" ? "All" : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visible.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden border border-parchment/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
            aria-label={`Open image: ${item.alt}`}
          >
            <Image
              src={item.url}
              alt={item.alt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
          </button>
        ))}
      </div>

      <DialogPrimitive.Root
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 focus:outline-none">
            <DialogPrimitive.Title className="sr-only">
              {current?.alt ?? "Gallery image"}
            </DialogPrimitive.Title>
            {current && (
              <div className="relative h-[78vh] w-full max-w-5xl">
                <Image
                  src={current.url}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            )}
            <p className="mt-4 font-sans text-[13px] text-parchment-dim">
              {current?.alt}
            </p>
            <button
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 border border-parchment/20 bg-ink/70 p-2.5 text-parchment hover:border-brass"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 border border-parchment/20 bg-ink/70 p-2.5 text-parchment hover:border-brass"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <DialogPrimitive.Close
              aria-label="Close gallery"
              className="absolute right-3 top-3 border border-parchment/20 bg-ink/70 p-2.5 text-parchment hover:border-brass"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
