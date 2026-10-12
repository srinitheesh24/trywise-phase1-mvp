/**
 * GOM - Garment Object Mapper (schema v0).
 *
 * Maps a merchant's product/garment payload into the normalized `Garment`
 * shape the kernel understands. The merchant keeps its catalog; Trywise
 * only consumes a mapped view. Keep this layer thin and dumb: no
 * inference, no guessing of missing measurements, no ML.
 *
 * UNKNOWN fields must be rejected, never guessed - per project rule:
 * "do not invent data".
 */

import {
  CORE_SCHEMA_VERSION,
  type Garment,
  type SizeOption,
} from "./types";

/** Raw merchant size row as we expect to receive it (field names per merchant contract, v0). */
export interface MerchantSizeRow {
  label: string;
  chest?: number;
  length?: number;
  shoulder?: number;
  unit?: string;
}

/** Raw merchant product payload (schema v0 - exact contracts still to be confirmed with real merchants). */
export interface MerchantProductInput {
  productId: string;
  category?: string;
  sizeChart: MerchantSizeRow[];
  /** Fraction 0..1 of circumference the fabric can stretch. Optional; defaults to 0. */
  stretchAllowance?: number;
}

export type GomResult =
  | { ok: true; garment: Garment }
  | { ok: false; error: string };

export class GarmentMapper {
  /**
   * Map a merchant product payload into a normalized Garment.
   * Returns a typed error instead of throwing so callers can show
   * honest failure states in the UI.
   */
  map(input: MerchantProductInput): GomResult {
    if (!input || typeof input.productId !== "string" || input.productId.length === 0) {
      return { ok: false, error: "GOM: productId is required" };
    }
    if (!Array.isArray(input.sizeChart) || input.sizeChart.length === 0) {
      return { ok: false, error: "GOM: sizeChart must be a non-empty array" };
    }
    if (input.category !== undefined && input.category !== "top") {
      return { ok: false, error: "GOM: only category 'top' is supported in this MVP build" };
    }

    const stretch = input.stretchAllowance ?? 0;
    if (!Number.isFinite(stretch) || stretch < 0 || stretch > 1) {
      return { ok: false, error: "GOM: stretchAllowance must be a fraction in [0, 1]" };
    }

    const sizeOptions: SizeOption[] = [];
    for (const row of input.sizeChart) {
      if (!row || typeof row.label !== "string" || row.label.length === 0) {
        return { ok: false, error: "GOM: every size row needs a non-empty label" };
      }
      if (row.unit !== undefined && row.unit !== "cm") {
        return { ok: false, error: "GOM: only unit 'cm' is supported (normalize upstream)" };
      }
      if (!Number.isFinite(row.chest) || !Number.isFinite(row.length)) {
        return { ok: false, error: `GOM: size "${row.label}" is missing numeric chest or length in cm` };
      }
      const chest = row.chest as number;
      const length = row.length as number;
      if (chest <= 0 || length <= 0) {
        return { ok: false, error: `GOM: size "${row.label}" has non-positive measurements` };
      }
      sizeOptions.push({
        label: row.label,
        chestCm: chest,
        lengthCm: length,
        ...(Number.isFinite(row.shoulder) ? { shoulderCm: row.shoulder as number } : {}),
      });
    }

    // Deterministic ordering: ascending chest, so the kernel can rely on order.
    sizeOptions.sort((a, b) => a.chestCm - b.chestCm);

    return {
      ok: true,
      garment: {
        productId: input.productId,
        category: "top",
        sizeOptions,
        stretchAllowance: stretch,
        schemaVersion: CORE_SCHEMA_VERSION,
      },
    };
  }
}
