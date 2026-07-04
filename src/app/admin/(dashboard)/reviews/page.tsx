import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewStatusBadge } from "@/components/admin/status-badge";
import { deleteReview, setReviewStatus, toggleReviewFeatured } from "./actions";

export default async function ReviewsPage() {
  await requireStaff(DESK);

  const reviews = await prisma.review.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const pending = reviews.filter((r) => r.status === "PENDING");
  const rest = reviews.filter((r) => r.status !== "PENDING");

  function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
    return (
      <article className="border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900">{review.guestName}</span>
          {review.location && (
            <span className="text-[12px] text-zinc-400">{review.location}</span>
          )}
          <span className="text-[12px] text-amber-600">
            {"★".repeat(review.rating)}
            <span className="text-zinc-300">{"★".repeat(5 - review.rating)}</span>
          </span>
          <ReviewStatusBadge status={review.status} />
          {review.featured && <Badge tone="blue">On homepage</Badge>}
        </div>
        {review.title && (
          <p className="mt-2 text-sm font-medium text-zinc-800">{review.title}</p>
        )}
        <p className="mt-1 text-sm leading-relaxed text-zinc-600">{review.body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {review.status !== "APPROVED" && (
            <form action={setReviewStatus}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <Button type="submit" variant="dark" size="sm">
                Approve
              </Button>
            </form>
          )}
          {review.status !== "REJECTED" && (
            <form action={setReviewStatus}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="status" value="REJECTED" />
              <Button type="submit" variant="light" size="sm">
                Reject
              </Button>
            </form>
          )}
          {review.status === "APPROVED" && (
            <form action={toggleReviewFeatured}>
              <input type="hidden" name="id" value={review.id} />
              <Button type="submit" variant="light" size="sm">
                {review.featured ? "Take off homepage" : "Feature on homepage"}
              </Button>
            </form>
          )}
          <form action={deleteReview}>
            <input type="hidden" name="id" value={review.id} />
            <Button type="submit" variant="ghost" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </article>
    );
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Approve what goes public and pick up to three to feature on the homepage."
      />

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Waiting for moderation ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          All reviews
        </h2>
        <div className="space-y-3">
          {rest.length === 0 && (
            <p className="border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-400">
              Nothing here yet.
            </p>
          )}
          {rest.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </>
  );
}
