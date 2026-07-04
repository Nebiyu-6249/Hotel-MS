import { prisma } from "@/lib/db";
import { formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { TaskStatusBadge } from "@/components/admin/status-badge";
import { createTask, deleteTask, setRoomStatus, setTaskStatus } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  CLEAN: "border-emerald-300 bg-emerald-50",
  DIRTY: "border-amber-300 bg-amber-50",
  OCCUPIED: "border-sky-300 bg-sky-50",
  MAINTENANCE: "border-red-300 bg-red-50",
};

const STATUS_CYCLE = ["CLEAN", "DIRTY", "OCCUPIED", "MAINTENANCE"] as const;

export default async function HousekeepingPage() {
  const [rooms, tasks, housekeepers] = await Promise.all([
    prisma.room.findMany({
      include: {
        roomType: { select: { name: true } },
        bookings: {
          where: { status: "CHECKED_IN" },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    }),
    prisma.housekeepingTask.findMany({
      where: { status: { not: "DONE" } },
      include: {
        room: { select: { number: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.user.findMany({
      where: { role: "HOUSEKEEPING" },
      select: { id: true, name: true },
    }),
  ]);

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort(
    (a, b) => a - b
  );

  return (
    <>
      <PageHeader
        title="Housekeeping"
        description="Room status board by floor, plus the task list. Tap a status to set it."
      />

      {floors.map((floor) => (
        <section key={floor} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">
            Floor {floor}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms
              .filter((room) => room.floor === floor)
              .map((room) => (
                <div
                  key={room.id}
                  className={cn(
                    "border p-3",
                    STATUS_STYLES[room.status] ?? "border-zinc-200 bg-white"
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-zinc-900">
                      Room {room.number}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {room.roomType.name}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {room.status.toLowerCase()}
                    {room.bookings.length > 0 && " (guest in house)"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {STATUS_CYCLE.map((status) => (
                      <form key={status} action={setRoomStatus}>
                        <input type="hidden" name="roomId" value={room.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          disabled={room.status === status}
                          className={cn(
                            "border px-2 py-1 text-[10px] uppercase tracking-wide",
                            room.status === status
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-500"
                          )}
                        >
                          {status.slice(0, 5).toLowerCase()}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Tasks</h2>
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <form
            action={createTask}
            className="h-fit space-y-3 border border-zinc-200 bg-white p-4"
          >
            <p className="text-[12px] text-zinc-500">New task</p>
            <Select name="roomId" required defaultValue="">
              <option value="" disabled>
                Room
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number} ({room.roomType.name})
                </option>
              ))}
            </Select>
            <Input name="title" placeholder="What needs doing" required />
            <Input name="notes" placeholder="Details (optional)" />
            <div className="grid grid-cols-2 gap-3">
              <Select name="assigneeId" defaultValue="">
                <option value="">Unassigned</option>
                {housekeepers.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
              <Input name="dueDate" type="date" aria-label="Due date" />
            </div>
            <Button type="submit" variant="dark" size="sm">
              Add Task
            </Button>
          </form>

          <Table>
            <THead>
              <tr>
                <Th>Task</Th>
                <Th>Room</Th>
                <Th>Assignee</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </THead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <Td colSpan={6} className="py-6 text-center text-zinc-400">
                    Nothing open. Enjoy it while it lasts.
                  </Td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr key={task.id}>
                  <Td>
                    <span className="font-medium text-zinc-900">{task.title}</span>
                    {task.notes && (
                      <span className="block text-[12px] text-zinc-400">
                        {task.notes}
                      </span>
                    )}
                  </Td>
                  <Td>Room {task.room.number}</Td>
                  <Td>{task.assignee?.name ?? "Unassigned"}</Td>
                  <Td>{task.dueDate ? formatDateShort(task.dueDate) : ""}</Td>
                  <Td>
                    <TaskStatusBadge status={task.status} />
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {task.status === "OPEN" && (
                        <form action={setTaskStatus}>
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="status" value="IN_PROGRESS" />
                          <Button type="submit" variant="light" size="sm">
                            Start
                          </Button>
                        </form>
                      )}
                      <form action={setTaskStatus}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="status" value="DONE" />
                        <Button type="submit" variant="light" size="sm">
                          Done
                        </Button>
                      </form>
                      <form action={deleteTask}>
                        <input type="hidden" name="id" value={task.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Remove
                        </Button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>
    </>
  );
}
