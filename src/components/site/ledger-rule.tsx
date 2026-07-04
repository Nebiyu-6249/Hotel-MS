import { cn } from "@/lib/utils";

// The site's signature divider: twin hairlines meeting at a small brass
// diamond, echoing the hand-forged ironwork in the stair rails.
export function LedgerRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden>
      <span className="h-px flex-1 bg-parchment/15" />
      <span className="h-1.5 w-1.5 rotate-45 border border-brass/70" />
      <span className="h-px flex-1 bg-parchment/15" />
    </div>
  );
}
