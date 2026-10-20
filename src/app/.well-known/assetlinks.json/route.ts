import { NextResponse } from "next/server";
import { buildAssetLinks } from "@/lib/auth/mobileApp";

// The Android counterpart of apple-app-site-association: ties the Gastify app (package name +
// signing certificate) to this domain so it can use its passkeys. ANDROID_CERT_SHA256 takes one or
// more SHA-256 fingerprints separated by commas; without it this answers 404.
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const links = buildAssetLinks(process.env.ANDROID_CERT_SHA256);
  if (!links) return new NextResponse(null, { status: 404 });
  return NextResponse.json(links, { headers: { "Cache-Control": "public, max-age=3600" } });
}
