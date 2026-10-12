/**
 * FitIntent extraction (MVP: keyword-based, per locked source-of-truth decision).
 *
 * Reads shopper-selected style words and maps them to a FitIntent.
 * The MVP intentionally avoids any model here. When keywords do not match,
 * we return the default ("regular") with an honest basis string - we never
 * fabricate an intent the shopper did not express.
 */

import type { FitIntent, FitIntentKind } from "./types";

const KEYWORD_MAP: Readonly<Record<string, FitIntentKind>> = {
  fitted: "fitted",
  slim: "fitted",
  tight: "fitted",
  bodycon: "fitted",
  regular: "regular",
  normal: "regular",
  classic: "regular",
  standard: "regular",
  relaxed: "relaxed",
  loose: "relaxed",
  comfy: "relaxed",
  oversized: "oversized",
  baggy: "oversized",
  oversized_fit: "oversized",
};

export class FitIntentExtractor {
  /**
   * Extract intent from raw keyword input (e.g. a selected chip on the PDP:
   * "How do you like it to fit? fitted / regular / relaxed / oversized").
   *
   * @param rawKeyword raw shopper input; may be null/empty.
   * @param fallback intent used when input does not match. Defaults to "regular".
   */
  extract(rawKeyword: string | null | undefined, fallback: FitIntentKind = "regular"): FitIntent {
    if (typeof rawKeyword !== "string" || rawKeyword.trim().length === 0) {
      return {
        kind: fallback,
        basis: "no keyword provided; using default intent",
        extractionMethod: "keyword",
      };
    }
    const normalized = rawKeyword.trim().toLowerCase().replace(/\s+/g, "_");
    const kind = KEYWORD_MAP[normalized];
    if (kind === undefined) {
      return {
        kind: fallback,
        basis: `keyword "${rawKeyword}" not recognized; using default intent`,
        extractionMethod: "keyword",
      };
    }
    return {
      kind,
      basis: `matched keyword "${rawKeyword}"`,
      extractionMethod: "keyword",
    };
  }
}
