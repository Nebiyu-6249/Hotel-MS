import type {
  BookingStatus,
  InquiryStatus,
  ReviewStatus,
  RoomStatus,
  TaskStatus,
} from "@prisma/client";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const BOOKING: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pending", tone: "amber" },
  CONFIRMED: { label: "Confirmed", tone: "green" },
  CHECKED_IN: { label: "In house", tone: "blue" },
  CHECKED_OUT: { label: "Checked out", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "red" },
  NO_SHOW: { label: "No-show", tone: "violet" },
};

const ROOM: Record<RoomStatus, { label: string; tone: BadgeTone }> = {
  CLEAN: { label: "Clean", tone: "green" },
  DIRTY: { label: "Dirty", tone: "amber" },
  OCCUPIED: { label: "Occupied", tone: "blue" },
  MAINTENANCE: { label: "Maintenance", tone: "red" },
};

const TASK: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: "Open", tone: "amber" },
  IN_PROGRESS: { label: "In progress", tone: "blue" },
  DONE: { label: "Done", tone: "green" },
};

const REVIEW: Record<ReviewStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pending", tone: "amber" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
};

const INQUIRY: Record<InquiryStatus, { label: string; tone: BadgeTone }> = {
  NEW: { label: "New", tone: "amber" },
  CONTACTED: { label: "Contacted", tone: "blue" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const s = ROOM[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = TASK[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const s = REVIEW[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const s = INQUIRY[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
