// Identity of the mobile app (apps/mobile) as the platforms see it. Passkeys are tied to a web
// domain: Apple and Google only let an app use the passkeys of a domain when that domain
// publishes a file saying "this app is mine" (served from /.well-known/, see the two routes
// under src/app/.well-known). Nothing here is secret; the Team ID and the signing fingerprint
// come from environment variables and are only available once the Apple Developer / Google
// Play accounts exist, so until then the files are simply not served (404).

// Must match apps/mobile/app.json (expo.ios.bundleIdentifier and expo.android.package).
export const MOBILE_BUNDLE_ID = "com.yayometro.gastify";

// apple-app-site-association: lets the iPhone app use this domain's passkeys ("webcredentials").
export function buildAppleAssociation(teamId: string | undefined): { webcredentials: { apps: string[] } } | null {
  const id = (teamId ?? "").trim();
  if (!/^[A-Z0-9]{10}$/.test(id)) return null;
  return { webcredentials: { apps: [`${id}.${MOBILE_BUNDLE_ID}`] } };
}

// "AA:BB:..." (as keytool / Play Console print it) -> the 32 bytes.
function fingerprintBytes(fingerprint: string): Buffer | null {
  const hex = fingerprint.replace(/:/g, "").trim();
  return /^[0-9a-fA-F]{64}$/.test(hex) ? Buffer.from(hex, "hex") : null;
}

function validFingerprints(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => fingerprintBytes(item) !== null);
}

// assetlinks.json: the same for Android, tied to the app's signing certificate.
export function buildAssetLinks(sha256: string | undefined): unknown[] | null {
  const fingerprints = validFingerprints(sha256);
  if (fingerprints.length === 0) return null;
  return [
    {
      relation: ["delegate_permission/common.get_login_creds"],
      target: { namespace: "android_app", package_name: MOBILE_BUNDLE_ID, sha256_cert_fingerprints: fingerprints },
    },
  ];
}

// What an Android passkey assertion reports as its "origin" (instead of the web origin).
// The server has to accept it when verifying a passkey sign-in coming from the Android app.
export function androidPasskeyOrigins(sha256: string | undefined): string[] {
  return validFingerprints(sha256).map(
    (fingerprint) => `android:apk-key-hash:${fingerprintBytes(fingerprint)!.toString("base64url")}`
  );
}

// The origins the passkey plugin verifies against. With no Android fingerprint configured this
// returns undefined, i.e. the plugin keeps its default (the server's own origin) - exactly what
// the web has always used. iPhone passkeys report the web origin, so they need nothing extra.
export function passkeyOrigins(baseUrl: string | undefined, sha256: string | undefined): string[] | undefined {
  const android = androidPasskeyOrigins(sha256);
  if (android.length === 0 || !baseUrl) return undefined;
  return [new URL(baseUrl).origin, ...android];
}
