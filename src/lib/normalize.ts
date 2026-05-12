const STOPWORDS = new Set(["a", "an", "the"]);

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .trim();
}

// Damerau-Levenshtein distance (capped for speed)
export function editDistance(a: string, b: string, cap = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
      if (dp[i][j] < rowMin) rowMin = dp[i][j];
    }
    if (rowMin > cap) return cap + 1;
  }
  return dp[m][n];
}

export type CanonicalGroup = { key: string; aliases: string[] };

/**
 * Map a normalized answer to a canonical key.
 * - First tries exact alias match (after normalization).
 * - Then fuzzy match (edit distance ≤ threshold based on length).
 * - Returns null if no match (caller decides whether to use the normalized
 *   string itself as the canonical key, or bucket as "other").
 */
export function matchCanonical(
  normalized: string,
  groups: CanonicalGroup[],
): string | null {
  if (!normalized) return null;
  for (const g of groups) {
    for (const alias of g.aliases) {
      if (normalize(alias) === normalized) return g.key;
    }
  }
  let best: { key: string; dist: number } | null = null;
  for (const g of groups) {
    for (const alias of g.aliases) {
      const na = normalize(alias);
      const threshold = Math.max(1, Math.floor(Math.max(na.length, normalized.length) / 5));
      const d = editDistance(na, normalized, threshold);
      if (d <= threshold && (!best || d < best.dist)) best = { key: g.key, dist: d };
    }
  }
  return best?.key ?? null;
}

/**
 * Auto-group a list of normalized strings via fuzzy clustering.
 * Returns canonical key per input (the most common member of its cluster).
 */
export function autoCluster(values: string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const uniq = Array.from(counts.keys()).sort(
    (a, b) => (counts.get(b)! - counts.get(a)!) || (a < b ? -1 : 1),
  );
  const clusterOf = new Map<string, string>();
  for (const v of uniq) {
    if (clusterOf.has(v)) continue;
    clusterOf.set(v, v);
    for (const other of uniq) {
      if (clusterOf.has(other)) continue;
      const threshold = Math.max(1, Math.floor(Math.max(v.length, other.length) / 5));
      if (editDistance(v, other, threshold) <= threshold) {
        clusterOf.set(other, v);
      }
    }
  }
  const result = new Map<string, string>();
  for (const v of values) result.set(v, clusterOf.get(v) ?? v);
  return result;
}
