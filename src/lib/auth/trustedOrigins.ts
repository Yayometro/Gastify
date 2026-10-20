// The mobile app talks to the auth server from a native scheme instead of a web origin. Better
// Auth's origin check (CSRF) has to be told to trust it. The web origin itself (BETTER_AUTH_URL)
// is always trusted and does not need listing.

// The URL scheme of the installed app (apps/mobile/app.json -> expo.scheme).
export const MOBILE_APP_SCHEME = "gastify";

// In production only the app's own scheme is trusted. While developing, Expo Go does not use the
// app's scheme but exp://<LAN ip>:<port>, so those patterns are trusted ONLY when
// NODE_ENV === "development" - never in a deployed build.
export function buildTrustedOrigins(nodeEnv: string | undefined): string[] {
  const origins = [`${MOBILE_APP_SCHEME}://`];
  if (nodeEnv === "development") {
    origins.push("exp://", "exp://**", "exp://192.168.*.*:*/**", "exp://10.*.*.*:*/**");
  }
  return origins;
}
