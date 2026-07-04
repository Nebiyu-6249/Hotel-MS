"use server";

import { revalidatePath } from "next/cache";
import type { RoomStatus, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ALL_STAFF, requireStaff } from "@/lib/guards";
import { parseDateParam } from "@/lib/utils";

const ROOM_STATUSES: RoomStatus[] = ["CLEAN", "DIRTY", "OCCUPIED", "MAINTENANCE"];
const TASK_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "DONE"];

export async function setRoomStatus(formData: FormData) {
  await requireStaff(ALL_STAFF);
  const roomId = String(formData.get("roomId") ?? "");
  const status = String(formData.get("status") ?? "") as RoomStatus;
  if (!roomId || !ROOM_STATUSES.includes(status)) return;

  await prisma.room.update({ where: { id: roomId }, data: { status } });
  revalidatePath("/admin/housekeeping");
  revalidatePath("/admin/rooms");
}

export async function createTask(formData: FormData) {
  await requireStaff(ALL_STAFF);
  const roomId = String(formData.get("roomId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!roomId || !title) return;

  await prisma.housekeepingTask.create({
    data: {
      roomId,
      title,
      notes: String(formData.get("notes") ?? "").trim() || null,
      assigneeId: String(formData.get("assigneeId") ?? "") || null,
      dueDate: parseDateParam(String(formData.get("dueDate") ?? "")),
    },
  });
  revalidatePath("/admin/housekeeping");
}

export async function setTaskStatus(formData: FormData) {
  await requireStaff(ALL_STAFF);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;
  if (!id || !TASK_STATUSES.includes(status)) return;

  await prisma.housekeepingTask.update({
    where: { id },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  revalidatePath("/admin/housekeeping");
}

export async function deleteTask(formData: FormData) {
  await requireStaff(ALL_STAFF);
  const id = String(formData.get("id") ?? "");
  await prisma.housekeepingTask.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/housekeeping");
}
