/** Normalize channel path for URLs and inputs; returns null if empty or invalid. */
export function tryNormalizeChannelPath(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) {
    return null;
  }
  const segments = String(raw)
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!segments.length) {
    return null;
  }
  return "/" + segments.join("/");
}
