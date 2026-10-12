import { describe, expect, it } from "vitest";
import { BodyEstimator, CLOTHING_CORRECTIONS_CM } from "../src/core/body-estimator";

describe("BodyEstimator", () => {
  const estimator = new BodyEstimator();

  it("computes the midpoint of the chest range", () => {
    const result = estimator.estimate(
      { chestCm: { low: 90, high: 98 } },
      "single-light-layer"
    );
    expect(result.chestCm).toBe(94);
    expect(result.estimateMethod).toBe("midpoint");
  });

  it("applies the clothing-state correction to produce the effective chest", () => {
    const result = estimator.estimate(
      { chestCm: { low: 90, high: 98 } },
      "single-medium-layer"
    );
    expect(result.clothingCorrectionCm).toBe(CLOTHING_CORRECTIONS_CM["single-medium-layer"]);
    expect(result.effectiveChestCm).toBe(94 + CLOTHING_CORRECTIONS_CM["single-medium-layer"]);
  });

  it("is deterministic: same inputs give identical outputs", () => {
    const a = estimator.estimate({ chestCm: { low: 88, high: 92 } }, "single-light-layer");
    const b = estimator.estimate({ chestCm: { low: 88, high: 92 } }, "single-light-layer");
    expect(a).toEqual(b);
  });

  it("throws on invalid ranges", () => {
    expect(() => estimator.estimate({ chestCm: { low: 100, high: 90 } }, "single-light-layer")).toThrow();
    expect(() => estimator.estimate({ chestCm: { low: -5, high: 90 } }, "single-light-layer")).toThrow();
    expect(() => estimator.estimate({ chestCm: { low: NaN, high: 90 } }, "single-light-layer")).toThrow();
  });

  it("throws on unknown clothing state", () => {
    expect(() =>
      estimator.estimate({ chestCm: { low: 90, high: 98 } }, "winter-coat" as never)
    ).toThrow();
  });
});
