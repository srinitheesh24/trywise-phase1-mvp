/**
 * Trywise Phase 1 MVP - Core domain types (schema v0).
 *
 * These types are the contract between all deterministic kernel modules.
 * They are intentionally small and explicit. Version every contract;
 * never mutate a shipped shape without bumping the schema version.
 *
 * MVP constraints locked in from project source-of-truth decisions:
 * - keyword-based FitIntent only
 * - midpoint estimates for body ranges
 * - simple clothing-state correction
 * - calibrationLevel = "none"
 */

export const CORE_SCHEMA_VERSION = "0.1.0" as const;

/** Garment categories supported by this kernel build. MVP starts with tops. */
export type GarmentCategory = "top";

/** Length units used across the kernel. MVP uses centimetres only. */
export type LengthUnit = "cm";

/** Calibration state of the decision pipeline. MVP is always "none". */
export type CalibrationLevel = "none";

/**
 * Fit intent: how the shopper wants the garment to sit.
 * MVP extraction is keyword-based (see fit-intent.ts).
 */
export type FitIntentKind =
  | "fitted"
  | "regular"
  | "relaxed"
  | "oversized";

export interface FitIntent {
  kind: FitIntentKind;
  /** Human-readable basis for the decision (explainability requirement). */
  basis: string;
  extractionMethod: "keyword";
}

/**
 * A single size option offered by the merchant for a garment,
 * expressed in the garment's own measurement table.
 */
export interface SizeOption {
  /** Merchant size label, e.g. "XS", "S", "M", "L", "XL". */
  label: string;
  /** Chest circumference of the garment, cm. */
  chestCm: number;
  /** Garment length, cm. */
  lengthCm: number;
  /** Optional shoulder width, cm. */
  shoulderCm?: number;
}

/**
 * Normalized garment record produced by the GOM from merchant data.
 * This is the ONLY garment shape the kernel understands.
 */
export interface Garment {
  /** Stable merchant/product identifier, carried through for provenance. */
  productId: string;
  category: GarmentCategory;
  /** Size chart entries, ordered by chestCm ascending. */
  sizeOptions: SizeOption[];
  /** Fabric stretch allowance as a fraction of garment circumference, 0..1. */
  stretchAllowance: number;
  schemaVersion: string;
}

/**
 * Body estimate input. MVP works with ranges (not point measurements)
 * and computes deterministic midpoint estimates.
 */
export interface BodyRange {
  /** Chest circumference range in cm, low <= high. */
  chestCm: { low: number; high: number };
}

/** Simple clothing-state descriptor used for the correction step. */
export type ClothingState =
  | "single-light-layer"
  | "single-medium-layer";

/**
 * Deterministic body estimate produced by the BodyEstimator.
 */
export interface BodyEstimate {
  /** Midpoint chest estimate in cm. */
  chestCm: number;
  /** Midpoint plus clothing-state correction, cm. */
  effectiveChestCm: number;
  /** Correction applied by the clothing-state step, cm. */
  clothingCorrectionCm: number;
  estimateMethod: "midpoint";
  clothingState: ClothingState;
}

/**
 * How a size compares to the shopper's effective chest measurement,
 * evaluated by the deterministic kernel.
 */
export type FitVerdict =
  | "too-small"
  | "close-fitted"
  | "good"
  | "relaxed"
  | "too-large";

export interface FitEvaluation {
  sizeLabel: string;
  verdict: FitVerdict;
  /**
   * Signed ease in cm: garment chest minus effective body chest.
   * Positive = roomier than body.
   */
  easeCm: number;
  /** Deterministic explanation string for UI display. */
  reason: string;
}

export interface FitDecision {
  productId: string;
  fitIntent: FitIntent;
  body: BodyEstimate;
  /** All evaluated sizes, in the order they will be presented. */
  evaluations: FitEvaluation[];
  /** The single size the kernel recommends, when evidence permits. */
  recommendedSizeLabel: string | null;
  /** Why no size was recommended, when recommendedSizeLabel is null. */
  abstainReason: string | null;
  calibrationLevel: CalibrationLevel;
  schemaVersion: string;
  kernelVersion: string;
}

/**
 * Public recommendation result returned by the SizeEngine.
 */
export interface SizeRecommendation {
  productId: string;
  recommendedSizeLabel: string | null;
  /** True when the kernel abstained: UI must show honest uncertainty. */
  abstained: boolean;
  explanation: string;
  decision: FitDecision;
}
