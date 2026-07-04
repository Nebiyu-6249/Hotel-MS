import type { TapeRow } from "@/lib/tape";
import { toDateString, todayUtc } from "@/lib/utils";
import { cn } from "@/lib/utils";

function cellTone(booked: number, capacity: number): string {
  if (capacity === 0) return "bg-zinc-200 text-zinc-500";
  if (booked >= capacity) return "bg-rose-200 text-rose-900";
  if (booked > 0) return "bg-amber-100 text-amber-900";
  return "bg-white text-zinc-400";
}

export function TapeChart({ rows }: { rows: TapeRow[] }) {
  if (rows.length === 0) return null;
  const today = toDateString(todayUtc());
  const dates = rows[0].cells.map((c) => c.date);

  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[140px] border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-medium text-zinc-500">
              Room type
            </th>
            {dates.map((date) => {
              const d = new Date(`${date}T00:00:00.000Z`);
              return (
                <th
                  key={date}
                  className={cn(
                    "min-w-[46px] border-b border-l border-zinc-200 px-1 py-2 text-center font-medium text-zinc-500",
                    date === today && "bg-sky-50 text-sky-700"
                  )}
                >
                  <span className="block">
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "short",
                      timeZone: "UTC",
                    }).format(d)}
                  </span>
                  <span className="block text-[13px] text-zinc-700">
                    {d.getUTCDate()}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="sticky left-0 z-10 border-b border-zinc-100 bg-white px-3 py-2 font-medium text-zinc-800">
                {row.name}
                <span className="ml-1 text-zinc-400">({row.units})</span>
              </td>
              {row.cells.map((cell) => (
                <td
                  key={cell.date}
                  className={cn(
                    "border-b border-l border-zinc-100 px-1 py-2 text-center tabular-nums",
                    cellTone(cell.booked, cell.capacity),
                    cell.date === today && "ring-1 ring-inset ring-sky-300"
                  )}
                  title={`${cell.booked} of ${cell.capacity} booked`}
                >
                  {cell.booked}/{cell.capacity}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-400">
        Sold/sellable per night. Amber: partly booked. Red: full. Gray: all
        units blocked.
      </p>
    </div>
  );
}
