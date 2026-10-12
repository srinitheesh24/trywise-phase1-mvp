/**
 * Trywise core - thin public API (Stage 1).
 *
 * Everything a merchant integration needs flows through `runDecisionPipeline`,
 * which is a pure, deterministic function: same inputs -> same output,
 * no network, no camera, no storage. Rendering and capture layers come
 * later and must consume these types; they must not add decision logic.
 */

import { GarmentMapper, type MerchantProductInput } from "./gom";
import { FitIntentExtractor } from "./fit-intent";
import { BodyEstimator, type ClothingState } from "./body-estimator";
import { FitDecisionKernel, KERNEL_VERSION } from "./fit-decision-kernel";
import { SizeEngine } from "./size-engine";
import type { FitIntentKind, SizeRecommendation } from "./types";

export * from "./types";
export {
  GarmentMapper,
  FitIntentExtractor,
  BodyEstimator,
  FitDecisionKernel,
  SizeEngine,
  KERNEL_VERSION,
  CLOTHING_CORRECTIONS_CM,
  INTENT_EASE_BANDS,
};
export type { MerchantProductInput, MerchantSizeRow, GomResult } from "./gom";

export interface DecisionPipelineInput {
  merchantProduct: MerchantProductInput;
  /** Shopper's chest range in cm. */
  chestRangeCm: { low: number; high: number };
  clothingState: ClothingState;
  fitIntentKeyword: string | null;
  fitIntentFallback?: FitIntentKind;
}

export type DecisionPipelineResult =
  | { ok: true; recommendation: SizeRecommendation }
  | { ok: false; error: string };

/** Convenience runner wiring the full deterministic pipeline end to end. */
export function runDecisionPipeline(
  input: DecisionPipelineInput
): DecisionPipelineResult {
  const gom = new GarmentMapper();
  const mapped = gom.map(input.merchantProduct);
  if (!mapped.ok) {
    return { ok: false, error: mapped.error };
  }

  const extractor = new FitIntentExtractor();
  const fitIntent = extractor.extract(
    input.fitIntentKeyword,
    input.fitIntentFallback ?? "regular"
  );

  let body;
  try {
    const estimator = new BodyEstimator();
    body = estimator.estimate(
      { chestCm: { low: input.chestRangeCm.low, high: input.chestRangeCm.high } },
      input.clothingState
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const kernel = new FitDecisionKernel();
  const decision = kernel.decide(mapped.garment, body, fitIntent);

  const engine = new SizeEngine();
  const recommendation = engine.recommend(decision);

  return { ok: true, recommendation };
}
