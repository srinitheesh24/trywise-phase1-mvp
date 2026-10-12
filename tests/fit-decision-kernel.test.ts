import { describe, expect, it } from "vitest";
import {
  FitDecisionKernel,
  INTENT_EASE_BANDS,
  TOO_LARGE_EASE_LIMIT,
  TOO_SMALL_EASE_LIMIT,
} from "../src/core/fit-decision-kernel";
import type { BodyEstimate, FitIntent, Garment } from "../src/core/types";

const garment: Garment = {
  productId: "prod-001",
  category: "top",
  sizeOptions: [
    { label: "S", chestCm: 96, lengthCm: 68 },
    { label: "M", chestCm: 102, lengthCm: 70 },
    { label: "L", chestCm: 108, lengthCm: 72 },
    { label: "XL", chestCm: 114, lengthCm: 74 },
  ],
  stretchAllowance: 0,
  schemaVersion: "0.1.0",
};

const body: BodyEstimate = {
  chestCm: 94,
  effectiveChestCm: 94.5,
  clothingCorrectionCm: 0.5,
  estimateMethod: "midpoint",
  clothingState: "single-light-layer",
};

function intent(kind: FitIntent["kind"]): FitIntent {
  return { kind, basis: "test", extractionMethod: "keyword" };
}

const kernel = new FitDecisionKernel();

describe("FitDecisionKernel", () => {
  it("recommends a size whose ease lands in the regular band", () => {
    const d = kernel.decide(garment, body, intent("regular"));
    expect(d.recommendedSizeLabel).toBe("M");
    const m = d.evaluations.find((e) => e.sizeLabel === "M");
    expect(m?.easeCm).toBe(7.5);
  });

  it("recommends a larger size for oversized intent", () => {
    const d = kernel.decide(garment, body, intent("oversized"));
    expect(d.recommendedSizeLabel).toBe("XL");
  });

  it("marks unwearably small sizes as too-small", () => {
    const tightBody: BodyEstimate = {
      ...body,
      effectiveChestCm: 110,
    };
    const d = kernel.decide(garment, tightBody, intent("regular"));
    expect(d.evaluations[0]?.verdict).toBe("too-small");
  });

  it("applies stretch allowance to the garment chest", () => {
    const stretchy: Garment = { ...garment, stretchAllowance: 0.05 };
    const d = kernel.decide(stretchy, body, intent("regular"));
    const m = d.evaluations.find((e) => e.sizeLabel === "M");
    expect(m?.easeCm).toBeCloseTo(7.5 + 102 * 0.05, 1);
  });

  it("abstains honestly when no size fits the intent band", () => {
    const hugeBody: BodyEstimate = { ...body, effectiveChestCm: 130 };
    const d = kernel.decide(garment, hugeBody, intent("fitted"));
    expect(d.recommendedSizeLabel).toBeNull();
    expect(d.abstainReason).toContain("no size");
  });

  it("is deterministic: identical inputs give identical decisions", () => {
    const a = kernel.decide(garment, body, intent("regular"));
    const b = kernel.decide(garment, body, intent("regular"));
    expect(a).toEqual(b);
  });

  it("stamps calibrationLevel none and the kernel version", () => {
    const d = kernel.decide(garment, body, intent("regular"));
    expect(d.calibrationLevel).toBe("none");
    expect(d.kernelVersion).toBe("0.1.0");
  });

  it("exposes inspectable ease bands and limits", () => {
    expect(INTENT_EASE_BANDS.fitted.min).toBe(-4);
    expect(INTENT_EASE_BANDS.oversized.max).toBe(32);
    expect(TOO_SMALL_EASE_LIMIT).toBe(-8);
    expect(TOO_LARGE_EASE_LIMIT).toBe(32);
  });

  it("throws on a garment with no sizes", () => {
    const empty: Garment = { ...garment, sizeOptions: [] };
    expect(() => kernel.decide(empty, body, intent("regular"))).toThrow();
  });
});
