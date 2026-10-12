/**
 * BodyEstimator (MVP: midpoint estimates + simple clothing-state correction,
 * per locked source-of-truth decisions).
 *
 * The MVP deliberately works with chest ranges rather than point
 * measurements, and applies a small deterministic correction for the
 * clothing the shopper is wearing during the flow. No pose data, no ML,
 * no camera dependency in this module - it is a pure function.
 */

import type { BodyEstimate, BodyRange, ClothingState } from "./types";

/** Deterministic correction in cm added for clothing state. MVP constants - version and test these. */
export const CLOTHING_CORRECTIONS_CM: Readonly<Record<ClothingState, number>> = {
  "single-light-layer": 0.5,
  "single-medium-layer": 1.5,
};

export class BodyEstimator {
  /**
   * Estimate the shopper's chest from a range using the midpoint method,
   * then apply the clothing-state correction.
   */
  estimate(range: BodyRange, clothingState: ClothingState): BodyEstimate {
    if (!range || !Number.isFinite(range.chestCm?.low) || !Number.isFinite(range.chestCm?.high)) {
      throw new Error("BodyEstimator: chestCm.low and chestCm.high must be finite numbers");
    }
    const low = range.chestCm.low as number;
    const high = range.chestCm.high as number;
    if (low <= 0 || high <= 0) {
      throw new Error("BodyEstimator: chest range values must be positive");
    }
    if (low > high) {
      throw new Error("BodyEstimator: chestCm.low must be <= chestCm.high");
    }
    const correction = CLOTHING_CORRECTIONS_CM[clothingState];
    if (correction === undefined) {
      throw new Error(`BodyEstimator: unknown clothing state "${clothingState}"`);
    }

    const chestCm = (low + high) / 2;
    const effectiveChestCm = chestCm + correction;

    return {
      chestCm,
      effectiveChestCm,
      clothingCorrectionCm: correction,
      estimateMethod: "midpoint",
      clothingState,
    };
  }
}
