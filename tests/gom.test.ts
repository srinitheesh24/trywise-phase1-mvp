import { describe, expect, it } from "vitest";
import { GarmentMapper } from "../src/core/gom";

const validInput = {
  productId: "prod-001",
  category: "top",
  sizeChart: [
    { label: "S", chest: 96, length: 68, shoulder: 44 },
    { label: "M", chest: 102, length: 70, shoulder: 46 },
    { label: "L", chest: 108, length: 72, shoulder: 48 },
  ],
};

describe("GarmentMapper", () => {
  it("maps a valid merchant product to a normalized garment", () => {
    const result = new GarmentMapper().map(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.garment.productId).toBe("prod-001");
      expect(result.garment.category).toBe("top");
      expect(result.garment.sizeOptions).toHaveLength(3);
      expect(result.garment.schemaVersion).toBe("0.1.0");
    }
  });

  it("sorts size options by ascending chest", () => {
    const result = new GarmentMapper().map({
      ...validInput,
      sizeChart: [...validInput.sizeChart].reverse(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const chests = result.garment.sizeOptions.map((s) => s.chestCm);
      expect(chests).toEqual([...chests].sort((a, b) => a - b));
    }
  });

  it("rejects a missing productId", () => {
    const result = new GarmentMapper().map({ ...validInput, productId: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("productId");
  });

  it("rejects an empty size chart", () => {
    const result = new GarmentMapper().map({ ...validInput, sizeChart: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a size row missing measurements instead of guessing", () => {
    const result = new GarmentMapper().map({
      ...validInput,
      sizeChart: [{ label: "M" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("missing numeric");
  });

  it("rejects unsupported categories", () => {
    const result = new GarmentMapper().map({
      ...validInput,
      category: "bottom",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("top");
  });

  it("rejects non-cm units", () => {
    const result = new GarmentMapper().map({
      ...validInput,
      sizeChart: [{ label: "M", chest: 40, length: 28, unit: "in" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("cm");
  });

  it("rejects out-of-range stretch allowance", () => {
    const result = new GarmentMapper().map({
      ...validInput,
      stretchAllowance: 1.5,
    });
    expect(result.ok).toBe(false);
  });

  it("defaults stretch allowance to 0", () => {
    const result = new GarmentMapper().map(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.garment.stretchAllowance).toBe(0);
  });
});
