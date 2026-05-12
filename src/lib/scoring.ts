import { autoCluster, matchCanonical, normalize, CanonicalGroup } from "./normalize";

export type AnswerRow = { id?: string; raw: string; normalized: string; canonical: string | null };

/**
 * Given all answers to a single question, compute canonical groupings and
 * return both the per-answer canonical assignment and the distribution.
 */
export function groupAnswers(
  rows: AnswerRow[],
  adminGroups: CanonicalGroup[],
): { canonicalByIndex: string[]; distribution: { key: string; count: number; percentage: number }[] } {
  const canonicalByIndex: string[] = new Array(rows.length).fill("other");
  const unmatchedIndexes: number[] = [];
  const unmatchedValues: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const n = rows[i].normalized;
    if (!n) {
      canonicalByIndex[i] = "other";
      continue;
    }
    const matched = adminGroups.length ? matchCanonical(n, adminGroups) : null;
    if (matched) canonicalByIndex[i] = matched;
    else {
      unmatchedIndexes.push(i);
      unmatchedValues.push(n);
    }
  }

  if (unmatchedValues.length) {
    const clusters = autoCluster(unmatchedValues);
    for (let k = 0; k < unmatchedIndexes.length; k++) {
      const idx = unmatchedIndexes[k];
      canonicalByIndex[idx] = clusters.get(unmatchedValues[k]) ?? "other";
    }
  }

  const total = rows.length || 1;
  const counts = new Map<string, number>();
  for (const c of canonicalByIndex) counts.set(c, (counts.get(c) ?? 0) + 1);
  const distribution = Array.from(counts.entries())
    .map(([key, count]) => ({ key, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  return { canonicalByIndex, distribution };
}

export function normalizeInput(raw: string) {
  return normalize(raw);
}
