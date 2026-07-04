import { LedgerRule } from "@/components/site/ledger-rule";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-parchment sm:text-4xl">
        {title}
      </h2>
      {lede && (
        <p className="mt-4 text-[15px] leading-relaxed text-parchment-dim">{lede}</p>
      )}
      <LedgerRule className={cn("mt-6", centered ? "mx-auto w-40" : "w-40")} />
    </div>
  );
}
