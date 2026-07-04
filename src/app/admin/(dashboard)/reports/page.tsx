import Link from "next/link";
import { MANAGEMENT, requireStaff } from "@/lib/guards";
import { getReportData } from "@/lib/reports";
import { addDaysUtc, eur, parseDateParam, toDateString, todayUtc } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Kpi } from "@/components/admin/kpi";
import { PageHeader } from "@/components/admin/page-header";
import { RevenueChart, SourceChart } from "@/components/admin/report-charts";

const SOURCE_LABEL: Record<string, string> = {
  WEBSITE: "Website (direct)",
  PHONE: "Phone",
  EMAIL: "Email",
  WALK_IN: "Walk-in",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  await requireStaff(MANAGEMENT);

  const today = todayUtc();
  const defaultFrom = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );
  const from = parseDateParam(searchParams.from) ?? defaultFrom;
  const to = parseDateParam(searchParams.to) ?? addDaysUtc(today, 1);

  const report = await getReportData(from, to);

  const presets = [
    { label: "This month", from: defaultFrom, to: addDaysUtc(today, 1) },
    { label: "Last 30 nights", from: addDaysUtc(today, -30), to: today },
    {
      label: "Last month",
      from: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)),
      to: defaultFrom,
    },
    {
      label: "Year to date",
      from: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)),
      to: addDaysUtc(today, 1),
    },
  ];

  const exportHref = `/admin/reports/export?from=${toDateString(from)}&to=${toDateString(to)}`;

  return (
    <>
      <PageHeader
        title="Reports"
        description={`${toDateString(from)} to ${toDateString(to)} (${report.days} night${report.days === 1 ? "" : "s"}, ${report.totalUnits} rooms)`}
      >
        <Button asChild variant="light" size="sm">
          <a href={exportHref}>Export CSV</a>
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <Link
            key={preset.label}
            href={`/admin/reports?from=${toDateString(preset.from)}&to=${toDateString(preset.to)}`}
            className="border border-zinc-300 bg-white px-3 py-1.5 text-[12px] text-zinc-600 hover:border-zinc-500"
          >
            {preset.label}
          </Link>
        ))}
        <form method="get" className="ml-auto flex items-center gap-2">
          <Input
            type="date"
            name="from"
            defaultValue={toDateString(from)}
            className="h-8 w-40 text-[13px]"
            aria-label="From"
          />
          <Input
            type="date"
            name="to"
            defaultValue={toDateString(to)}
            className="h-8 w-40 text-[13px]"
            aria-label="To (exclusive)"
          />
          <Button type="submit" variant="dark" size="sm">
            Apply
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Occupancy"
          value={`${report.occupancyPercent.toFixed(1)}%`}
          sub={`${report.roomNightsSold} of ${report.totalUnits * report.days} room-nights`}
        />
        <Kpi label="ADR" value={eur(report.adrCents)} sub="average daily rate" />
        <Kpi label="RevPAR" value={eur(report.revparCents)} sub="revenue per available room" />
        <Kpi
          label="Room revenue"
          value={eur(report.roomRevenueCents)}
          sub="nights inside the range"
        />
        <Kpi
          label="Booked value"
          value={eur(report.bookedValueCents)}
          sub={`${report.bookingCount} arrivals, incl. add-ons and VAT`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Room revenue by night</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={report.revenueByDay.map((d) => ({
                date: d.date,
                revenue: d.revenueCents / 100,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings by source</CardTitle>
          </CardHeader>
          <CardContent>
            {report.bySource.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-400">
                No arrivals in this range.
              </p>
            ) : (
              <SourceChart
                data={report.bySource.map((s) => ({
                  name: SOURCE_LABEL[s.source] ?? s.source,
                  value: s.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 max-w-md">
        <Table>
          <THead>
            <tr>
              <Th>Lost business</Th>
              <Th className="text-right">Count</Th>
            </tr>
          </THead>
          <tbody>
            <tr>
              <Td>Cancellations (by arrival date)</Td>
              <Td className="text-right">{report.cancellations}</Td>
            </tr>
            <tr>
              <Td>No-shows</Td>
              <Td className="text-right">{report.noShows}</Td>
            </tr>
          </tbody>
        </Table>
      </div>
    </>
  );
}
