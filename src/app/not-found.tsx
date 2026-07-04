import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-parchment">
      <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-brass">
        Wrong corridor
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium">
        This page is not in the house
      </h1>
      <p className="mt-3 max-w-sm font-sans text-[14px] text-parchment-dim">
        The link is old or the address is off by a letter. The front hall is
        this way.
      </p>
      <Link
        href="/"
        className="mt-8 bg-brass px-6 py-3 font-sans text-[12px] uppercase tracking-[0.14em] text-ink"
      >
        Back to the site
      </Link>
    </main>
  );
}
