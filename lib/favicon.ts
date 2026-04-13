export function faviconUrl(platformUrl: string | null | undefined): string | null {
  if (!platformUrl) return null;
  let host = platformUrl.trim();
  try {
    if (!/^https?:\/\//.test(host)) host = `https://${host}`;
    const url = new URL(host);
    return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
  } catch {
    return null;
  }
}

export function normalizeDomain(input: string): string {
  let host = input.trim();
  try {
    if (!/^https?:\/\//.test(host)) host = `https://${host}`;
    return new URL(host).hostname.replace(/^www\./, "");
  } catch {
    return input;
  }
}
