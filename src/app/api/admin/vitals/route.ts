import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/betterAuth";
import { recordVital } from "@/lib/admin/metrics";
import { VITAL_NAMES, type VitalName } from "@/lib/admin/metricsMath";

// Receives the Web Vitals a signed-in browser measured (see WebVitalsReporter). Only the metric name and its value are stored, as
// counters per day; the request itself is not kept. Anonymous callers are refused so the endpoint cannot be used to fill the
// database.
export async function POST(request: NextRequest): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new NextResponse(null, { status: 401 });

  let body: { metric?: unknown; value?: unknown };
  try {
    body = (await request.json()) as { metric?: unknown; value?: unknown };
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const metric = body.metric;
  const value = body.value;
  if (typeof metric !== "string" || !(VITAL_NAMES as readonly string[]).includes(metric)) {
    return new NextResponse(null, { status: 400 });
  }
  // A real LCP, INP or CLS value is never negative nor longer than a minute (CLS arrives multiplied by 1000).
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 60000) {
    return new NextResponse(null, { status: 400 });
  }
  await recordVital(metric as VitalName, value);
  return new NextResponse(null, { status: 204 });
}
