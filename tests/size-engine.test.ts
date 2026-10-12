import { describe, expect, it } from "vitest";
import { SizeEngine } from "../src/core/size-engine";
import { FitDecisionKernel } from "../src/core/fit-decision-kernel";
import type { BodyEstimate, FitIntent, Garment } from "../src/core/types";

const garment: Garment = {
  productId: "prod-001",
  category: "top",
  sizeOptions: [
    { label: "S", chestCm: 96, lengthCm: 68 },
    { label: "M", chestCm: 102, lengthCm: 70 },
    { label: "L", chestCm: 108, lengthCm: 72 },
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

const intent: FitIntent = {
  kind: "regular",
  basis: "test",
  extractionMethod: "keyword",
};

const engine = new SizeEngine();
const kernel = new FitDecisionKernel();

describe("SizeEngine", () => {
  it("packages a kernel recommendation for the UI", () => {
    const rec = engine.recommend(kernel.decide(garment, body, intent));
    expect(rec.abstained).toBe(false);
    expect(rec.recommendedSizeLabel).toBe("M");
    expect(rec.explanation).toContain("M");
  });

  it("surfaces abstention as an honest cannot-recommend state", () => {
    const hugeBody: BodyEstimate = { ...body, effectiveChestCm: 130 };
    const rec = engine.recommend(kernel.decide(garment, hugeBody, intent));
    expect(rec.abstained).toBe(true);
    expect(rec.recommendedSizeLabel).toBeNull();
    expect(rec.explanation).toContain("cannot confidently recommend");
  });

  it("carries the full decision for provenance and auditing", () => {
    const rec = engine.recommend(kernel.decide(garment, body, intent));
    expect(rec.decision.productId).toBe("prod-001");
    expect(rec.decision.evaluations).toHaveLength(3);
    expect(rec.decision.calibrationLevel).toBe("none");
  });
});
