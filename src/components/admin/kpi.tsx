import { Card, CardContent } from "@/components/ui/card";

export function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
        {sub && <p className="mt-0.5 text-[12px] text-zinc-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}
