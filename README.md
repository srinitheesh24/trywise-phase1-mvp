# Trywise — Phase 1 MVP (Stage 1: Deterministic Fit/Size Kernel)

**Branch:** `mvp/stage1-kernel` | **Status:** in progress | **Evidence discipline:** see the Master Handoff Report (v1.0, 12 Oct 2026).

## What this stage is

The smallest testable core of Trywise's initial wedge: **a deterministic, explainable fit/size decision kernel** that, given merchant garment data and a body estimate, returns either one recommended size or an honest "cannot confidently recommend" result.

## What this stage is NOT (scope boundaries from the handoff report)

- No camera/pose capture yet
- No rendering/visualisation layer yet
- No ML of any kind (by design; kernel is deterministic)
- No AI stylist, marketplace, scraper, or broad fashion assistant
- No account, questionnaire, avatar, or photo-upload requirements in the data contracts

## Pipeline

```
Merchant product/garment data
  -> GOM (merchant product -> normalized Trywise garment)
  -> BodyEstimator (midpoint estimates + simple clothing-state correction)
  -> FitIntent extraction (keyword-based)
  -> FitDecisionKernel (deterministic, sole decision authority)
  -> SizeEngine
  -> one recommended size OR "cannot confidently recommend"
```

## Module map

| Path | Purpose |
|---|---|
| `src/core/types.ts` | Domain types (Garment, SizeOption, BodyEstimate, FitIntent, FitDecision, SizeRecommendation) |
| `src/core/gom.ts` | Garment Object Mapper: merchant payload -> normalized garment (schema v0) |
| `src/core/fit-intent.ts` | Keyword-based fit intent extraction |
| `src/core/body-estimator.ts` | Midpoint body estimates + clothing-state correction |
| `src/core/fit-decision-kernel.ts` | Deterministic fit decision kernel |
| `src/core/size-engine.ts` | Size recommendation from fit decision |
| `src/core/index.ts` | Thin public API |
| `tests/` | Unit tests per module |

## Commands

```bash
npm install
npm run build
npm test
```

## Known limitations (honest)

- Garment category for fixtures: **tops (t-shirts/shirts)** — founder-confirmed default pending.
- `calibrationLevel = "none"` for all decisions; no calibration data exists yet.
- GOM schema is v0; exact merchant contracts are unconfirmed.
- No measured accuracy, latency, or merchant evidence exists. None is claimed.
