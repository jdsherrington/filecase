export function getCookieValue(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName || rawValue.length === 0) {
      continue;
    }

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}
