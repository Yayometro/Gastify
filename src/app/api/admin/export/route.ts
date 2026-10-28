import { NextResponse, type NextRequest } from "next/server";
import { adminCaller } from "@/lib/admin/guard";
import { getOverview } from "@/lib/admin/platformStats";
import { parseRange } from "@/lib/admin/statsMath";
import { toCsv } from "@/lib/admin/csv";
import { USAGE_EVENTS } from "@/lib/admin/metrics";

// Aggregates only, as CSV: the daily series, the weekly cohorts and the route timings. Never a person, an amount or a name.
// Anyone who is not an admin gets the same 404 as a page that does not exist.
export async function GET(request: NextRequest): Promise<Response> {
  const caller = await adminCaller(request.headers);
  if (!caller) return new NextResponse(null, { status: 404 });

  const url = new URL(request.url);
  const range = parseRange(url.searchParams.get("range") ?? undefined);
  const kind = url.searchParams.get("kind");
  const overview = await getOverview(range);
  const stamp = overview.generatedAt.slice(0, 10);

  let body: string;
  let name: string;
  if (kind === "daily") {
    const transactions = new Map(overview.activity.transactionsByDay.map((entry) => [entry.day, entry.count]));
    const usage = USAGE_EVENTS.map((event) => new Map(overview.usage.find((entry) => entry.event === event)?.series.map((entry) => [entry.day, entry.count]) ?? []));
    body = toCsv(
      ["day", "signups", "transactions", ...USAGE_EVENTS],
      overview.activity.signupsByDay.map((entry) => [
        entry.day,
        entry.count,
        transactions.get(entry.day) ?? 0,
        ...usage.map((series) => series.get(entry.day) ?? 0),
      ])
    );
    name = `gastify-admin-diario-${range}d-${stamp}.csv`;
  } else if (kind === "cohorts") {
    body = toCsv(
      ["week", "signups", "retention_w1", "eligible_w1", "retention_w2", "eligible_w2", "retention_w4", "eligible_w4"],
      overview.cohorts.map((row) => [
        row.week,
        row.signups,
        row.retention[0].rate,
        row.retention[0].eligible,
        row.retention[1].rate,
        row.retention[1].eligible,
        row.retention[2].rate,
        row.retention[2].eligible,
      ])
    );
    name = `gastify-admin-cohortes-${stamp}.csv`;
  } else if (kind === "routes") {
    body = toCsv(
      ["route", "requests", "error_rate", "average_ms", "p50_ms", "p95_ms", "max_ms"],
      overview.performance.routes.map((row) => [row.route, row.requests, row.errorRate, Math.round(row.averageMs), row.p50, row.p95, row.maxMs])
    );
    name = `gastify-admin-rutas-${range}d-${stamp}.csv`;
  } else {
    return new NextResponse("kind must be daily, cohorts or routes", { status: 400 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
