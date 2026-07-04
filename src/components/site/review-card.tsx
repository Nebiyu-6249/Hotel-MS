import { Star } from "lucide-react";

export function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= rating
              ? "h-3.5 w-3.5 fill-brass text-brass"
              : "h-3.5 w-3.5 text-parchment/20"
          }
          aria-hidden
        />
      ))}
    </div>
  );
}

export function ReviewCard({
  review,
}: {
  review: {
    guestName: string;
    location: string | null;
    rating: number;
    title: string | null;
    body: string;
  };
}) {
  return (
    <figure className="flex h-full flex-col border border-parchment/10 bg-ink-soft p-6">
      <Stars rating={review.rating} />
      {review.title && (
        <p className="mt-4 font-display text-xl font-medium text-parchment">
          {review.title}
        </p>
      )}
      <blockquote className="mt-3 flex-1 font-sans text-[13px] leading-relaxed text-parchment-dim">
        {review.body}
      </blockquote>
      <figcaption className="mt-5 font-sans text-[12px] uppercase tracking-[0.16em] text-parchment-faint">
        {review.guestName}
        {review.location ? `, ${review.location}` : ""}
      </figcaption>
    </figure>
  );
}
