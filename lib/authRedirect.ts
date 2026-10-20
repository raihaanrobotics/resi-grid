interface AuthRedirectOptions {
  currentOrigin: string;
  isNativePlatform: boolean;
  siteUrl?: string;
}

export function getAuthCallbackUrl({
  currentOrigin,
  isNativePlatform,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
}: AuthRedirectOptions): string {
  const configuredSiteUrl = siteUrl?.trim();
  const baseUrl = configuredSiteUrl || (isNativePlatform ? "" : currentOrigin);

  if (!baseUrl) {
    throw new Error("Set NEXT_PUBLIC_SITE_URL to your HTTPS website URL before enabling native sign-up.");
  }

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute website URL.");
  }

  const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) {
    throw new Error("The sign-up redirect must use HTTPS (HTTP is allowed only for local development).");
  }

  if (isNativePlatform && (url.protocol !== "https:" || isLocalHost)) {
    throw new Error("Native sign-up requires NEXT_PUBLIC_SITE_URL to be your public HTTPS website URL.");
  }

  url.pathname = "/auth/callback";
  url.search = "";
  url.hash = "";
  return url.toString();
}
