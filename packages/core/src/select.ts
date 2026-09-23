import type { RankedRecommendation } from "./schemas.js";

/**
 * Rank candidates by predicted value among PASS decisions only.
 * BLOCK results are excluded from the ranked list.
 */
export function selectOptimal(
  candidates: RankedRecommendation[]
): RankedRecommendation[] {
  const passed = candidates.filter((c) => c.decision.outcome === "PASS");
  const ranked = [...passed].sort((a, b) => {
    if (b.score.value !== a.score.value) return b.score.value - a.score.value;
    return b.score.confidence - a.score.confidence;
  });
  return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
}
