/** One callback builder is shared by authorization and token exchange. */
export function buildGoogleRedirectUri(
  appUrl?: string,
  nodeEnv?: string,
): string {
  const base =
    appUrl?.trim() || (nodeEnv === "production" ? "" : "http://localhost:3002");
  if (!base)
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required for Google OAuth in production",
    );
  const url = new URL(base);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be an origin without credentials, path, query, or fragment",
    );
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && local && nodeEnv !== "production")
  ) {
    throw new Error("Google OAuth requires HTTPS outside local development");
  }
  return `${url.origin}/api/connectors/google/callback`;
}
