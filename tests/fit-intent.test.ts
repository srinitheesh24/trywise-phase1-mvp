import { describe, expect, it } from "vitest";
import { FitIntentExtractor } from "../src/core/fit-intent";

describe("FitIntentExtractor", () => {
  const extractor = new FitIntentExtractor();

  it("maps known keywords to intent kinds", () => {
    expect(extractor.extract("fitted").kind).toBe("fitted");
    expect(extractor.extract("SLIM").kind).toBe("fitted");
    expect(extractor.extract("regular").kind).toBe("regular");
    expect(extractor.extract("Loose").kind).toBe("relaxed");
    expect(extractor.extract("baggy").kind).toBe("oversized");
  });

  it("normalizes whitespace into underscores", () => {
    expect(extractor.extract("oversized fit").kind).toBe("oversized");
  });

  it("falls back to the default intent for unknown keywords, with honest basis", () => {
    const result = extractor.extract("boho");
    expect(result.kind).toBe("regular");
    expect(result.basis).toContain("not recognized");
  });

  it("falls back for null and empty input", () => {
    expect(extractor.extract(null).kind).toBe("regular");
    expect(extractor.extract("").kind).toBe("regular");
    expect(extractor.extract("   ").kind).toBe("regular");
  });

  it("respects a caller-provided fallback", () => {
    expect(extractor.extract(null, "relaxed").kind).toBe("relaxed");
  });

  it("always records the keyword extraction method", () => {
    expect(extractor.extract("slim").extractionMethod).toBe("keyword");
  });
});
