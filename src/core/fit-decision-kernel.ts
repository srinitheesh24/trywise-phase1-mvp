/**
 * FitDecisionKernel - the deterministic decision authority of the MVP.
 *
 * This module is the sole source of fit/size verdicts. Rules below are
 * simple, versioned, inspectable, and unit-tested. Per project rule:
 * no ML may silently redefine these rules.
 *
 * Ease model (tops, cm):
 *   ease = garment chest + stretch allowance - effective body chest
 *
 * Intent target ease bands (deterministic constants - tune only via
 * explicit, tested decisions):
 *   fitted:    [-4, 0)
 *   regular:   [0, 8)
 *   relaxed:   [8, 16)
 *   oversized: [16, 32]
 *
 * A size is "acceptable" for the intent if its ease falls inside the band.
 * Recommendation rule: the smallest acceptable ease size whose verdict is
 * not "too-small" or "too-large". If no size qualifies, the kernel abstains.
 */

import {
  CORE_SCHEMA_VERSION,
  type FitDecision,
  type FitEvaluation,
  type FitIntent,
  type FitVerdict,
  type Garment,
  type BodyEstimate,
} from "./types";

export const KERNEL_VERSION = "0.1.0" as const;

export type EaseBand = { min: number; max: number };

export const INTENT_EASE_BANDS: Readonly<Record<FitIntent["kind"], EaseBand>> = {
  fitted: { min: -4, max: 0 },
  regular: { min: 0, max: 8 },
  relaxed: { min: 8, max: 16 },
  oversized: { min: 16, max: 32 },
};

/** Hard safety limits beyond which a size is not wearable, regardless of intent. */
export const TOO_SMALL_EASE_LIMIT = -8;
export const TOO_LARGE_EASE_LIMIT = 32;

export class FitDecisionKernel {
  decide(garment: Garment, body: BodyEstimate, fitIntent: FitIntent): FitDecision {
    if (garment.sizeOptions.length === 0) {
      throw new Error("FitDecisionKernel: garment has no size options");
    }

    const band = INTENT_EASE_BANDS[fitIntent.kind];
    if (band === undefined) {
      throw new Error(`FitDecisionKernel: unknown fit intent "${fitIntent.kind}"`);
    }

    const evaluations: FitEvaluation[] = garment.sizeOptions.map((size) => {
      const effectiveGarmentChest =
        size.chestCm * (1 + garment.stretchAllowance);
      const easeCm = effectiveGarmentChest - body.effectiveChestCm;
      return {
        sizeLabel: size.label,
        verdict: this.verdictFor(easeCm),
        easeCm: round1(easeCm),
        reason: this.reasonFor(size.label, easeCm),
      };
    });

    const recommended = evaluations.find(
      (e) =>
        e.verdict !== "too-small" &&
        e.verdict !== "too-large" &&
        e.easeCm >= band.min &&
        e.easeCm < band.max
    );

    let abstainReason: string | null = null;
    if (recommended === undefined) {
      abstainReason = `no size lands in the ${fitIntent.kind} ease band (${band.min} to ${band.max} cm) without being unwearable`;
    }

    return {
      productId: garment.productId,
      fitIntent,
      body,
      evaluations,
      recommendedSizeLabel: recommended?.sizeLabel ?? null,
      abstainReason,
      calibrationLevel: "none",
      schemaVersion: CORE_SCHEMA_VERSION,
      kernelVersion: KERNEL_VERSION,
    };
  }

  private verdictFor(easeCm: number): FitVerdict {
    if (easeCm <= TOO_SMALL_EASE_LIMIT) return "too-small";
    if (easeCm >= TOO_LARGE_EASE_LIMIT) return "too-large";
    if (easeCm < 0) return "close-fitted";
    if (easeCm < 8) return "good";
    if (easeCm < 16) return "relaxed";
    return "relaxed";
  }

  private reasonFor(sizeLabel: string, easeCm: number): string {
    if (easeCm <= TOO_SMALL_EASE_LIMIT) {
      return `${sizeLabel}: unwearably tight (ease ${easeCm} cm)`;
    }
    if (easeCm >= TOO_LARGE_EASE_LIMIT) {
      return `${sizeLabel}: unwearably large (ease ${easeCm} cm)`;
    }
    if (easeCm < 0) {
      return `${sizeLabel}: close-fitted, garment sits against the body (ease ${easeCm} cm)`;
    }
    if (easeCm < 8) {
      return `${sizeLabel}: good regular fit (ease ${easeCm} cm)`;
    }
    return `${sizeLabel}: relaxed fit (ease ${easeCm} cm)`;
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
