import { describe, expect, it } from "vitest";
import { runDecisionPipeline } from "../src/core";

const validProduct = {
  productId: "prod-001",
  category: "top",
  sizeChart: [
    { label: "S", chest: 96, length: 68 },
    { label: "M", chest: 102, length: 70 },
    { label: "L", chest: 108, length: 72 },
    { label: "XL", chest: 114, length: 74 },
  ],
};

describe("runDecisionPipeline (end to end, deterministic)", () => {
  it("recommends one size for a typical shopper flow", () => {
    const result = runDecisionPipeline({
      merchantProduct: validProduct,
      chestRangeCm: { low: 90, high: 98 },
      clothingState: "single-light-layer",
      fitIntentKeyword: "regular",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.abstained).toBe(false);
      expect(result.recommendation.recommendedSizeLabel).toBe("M");
      expect(result.recommendation.decision.calibrationLevel).toBe("none");
    }
  });

  it("routes intent keywords through to the kernel", () => {
    const result = runDecisionPipeline({
      merchantProduct: validProduct,
      chestRangeCm: { low: 90, high: 98 },
      clothingState: "single-light-layer",
      fitIntentKeyword: "oversized",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.recommendation.recommendedSizeLabel).toBe("XL");
  });

  it("returns a typed error for an invalid merchant product", () => {
    const result = runDecisionPipeline({
      merchantProduct: { ...validProduct, sizeChart: [] },
      chestRangeCm: { low: 90, high: 98 },
      clothingState: "single-light-layer",
      fitIntentKeyword: "regular",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("GOM");
  });

  it("returns a typed error for an invalid body range", () => {
    const result = runDecisionPipeline({
      merchantProduct: validProduct,
      chestRangeCm: { low: 120, high: 90 },
      clothingState: "single-light-layer",
      fitIntentKeyword: "regular",
    });
    expect(result.ok).toBe(false);
  });

  it("abstains end to end when nothing fits", () => {
    const result = runDecisionPipeline({
      merchantProduct: validProduct,
      chestRangeCm: { low: 126, high: 134 },
      clothingState: "single-light-layer",
      fitIntentKeyword: "fitted",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.abstained).toBe(true);
      expect(result.recommendation.recommendedSizeLabel).toBeNull();
    }
  });

  it("is deterministic across repeated runs", () => {
    const a = runDecisionPipeline({
      merchantProduct: validProduct,
      chestRangeCm: { low: 90, high: 98 },
      clothingState: "single-medium-layer",
      fitIntentKeyword: null,
    });
    const b = runDecisionPipeline({
      merchantProduct: validProduct,
      chestRangeCm: { low: 90, high: 98 },
      clothingState: "single-medium-layer",
      fitIntentKeyword: null,
    });
    expect(a).toEqual(b);
  });
});
