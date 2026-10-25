import { NextResponse } from "next/server";
import { buildAppleAssociation } from "@/lib/auth/mobileApp";

// Tells iOS that the Gastify app may use this domain's passkeys. Apple fetches it over HTTPS
// without redirects, as JSON. Served only once APPLE_TEAM_ID is set (an Apple Developer account
// is needed to have one); until then it is a 404, which is what any other site would answer.
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const association = buildAppleAssociation(process.env.APPLE_TEAM_ID);
  if (!association) return new NextResponse(null, { status: 404 });
  return NextResponse.json(association, { headers: { "Cache-Control": "public, max-age=3600" } });
}
