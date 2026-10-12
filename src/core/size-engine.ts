/**
 * SizeEngine - turns a FitDecision into the public SizeRecommendation.
 *
 * Thin by design: no new rules here, just presentation-safe packaging of
 * the kernel's deterministic output. The UI MUST surface abstentions as
 * honest "cannot confidently recommend" states, never as a guess.
 */

import type { FitDecision, SizeRecommendation } from "./types";

export class SizeEngine {
  recommend(decision: FitDecision): SizeRecommendation {
    if (decision.recommendedSizeLabel !== null) {
      const evalForSize = decision.evaluations.find(
        (e) => e.sizeLabel === decision.recommendedSizeLabel
      );
      return {
        productId: decision.productId,
        recommendedSizeLabel: decision.recommendedSizeLabel,
        abstained: false,
        explanation:
          evalForSize !== undefined
            ? `Recommended ${decision.recommendedSizeLabel}: ${evalForSize.reason} (fit intent: ${decision.fitIntent.kind})`
            : `Recommended ${decision.recommendedSizeLabel} (fit intent: ${decision.fitIntent.kind})`,
        decision,
      };
    }

    return {
      productId: decision.productId,
      recommendedSizeLabel: null,
      abstained: true,
      explanation: `We cannot confidently recommend a size: ${decision.abstainReason ?? "insufficient evidence"}. Consider checking the brand's size chart or contacting the store.`,
      decision,
    };
  }
}
