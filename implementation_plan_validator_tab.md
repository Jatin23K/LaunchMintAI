# Plan: Credible Validator Report Without Changing the Existing Report Shape

## Summary

Rebuild the Validator around an evidence-first pipeline while keeping the current report structure and UI sections intact. Every existing section in the Validator report remains present, but each field is reclassified internally as `verified`, `estimated`, `inferred`, or `unsupported`, with explicit provenance and uncertainty attached. The end state is not “always correct”; it is “auditable, honest, source-backed where possible, and visibly uncertain where not.”

The implementation should be done in staged layers so the current Validator tab keeps rendering the same top-level report structure (`market`, `competitors`, `god_mode`, `dept_*`, `citations`, DS cards, war-room/extension panels), but the data feeding that structure becomes deterministic, validated, and traceable.

## Key Changes

### 1. Introduce an internal evidence model without changing the external Validator report layout

Add an internal evidence layer that sits between search and report synthesis. Keep the current Validator response shape for the frontend, but generate it from a richer backend structure.

Required internal types:
- `EvidenceSource`: `url`, `title`, `domain`, `published_at`, `source_tier`, `retrieved_at`
- `EvidenceClaim`: `claim_id`, `claim_type`, `raw_text`, `normalized_value`, `unit`, `year`, `quote`, `source_url`, `source_title`, `status`, `confidence`, `extraction_method`
- `FieldProvenance`: `field_path`, `status`, `source_url`, `source_quote`, `source_year`, `notes`
- `ReportCredibilityMeta`: `grounded_fields`, `estimated_fields`, `inferred_fields`, `unsupported_fields`, `conflicts_detected`, `stale_sources`, `generated_at`

Status vocabulary must be fixed and reused everywhere:
- `verified`: exact source-backed extraction
- `estimated`: calculated or range-derived from source-backed inputs
- `inferred`: model-generated interpretation from evidence, not direct fact extraction
- `unsupported`: no adequate evidence available

Implementation rule:
- Do not remove any current field from the Validator payload.
- Add a sibling metadata object, e.g. `credibility`, `field_provenance`, and `evidence`, while preserving all current report sections.
- Existing fields continue to populate the UI, but the UI must be able to inspect provenance for every important field.

### 2. Split the current `/analyze` flow into strict backend stages

Refactor the Validator pipeline in `backend/app/services/llm_engine.py` into discrete, testable stages. Keep the `/analyze` endpoint, but make it orchestrate these stages instead of doing everything in one prompt-heavy block.

Target pipeline:
1. `classify_market_scope(idea)`
2. `build_search_brief(idea, classified_scope)`
3. `search_market_sources(search_brief)`
4. `dedupe_and_rank_sources(raw_sources)`
5. `extract_market_claims(sources, scope)`
6. `validate_market_claims(extracted_claims, scope)`
7. `extract_competitor_candidates(idea, sources, preliminary_context)`
8. `resolve_competitor_profiles(candidates)`
9. `build_verified_fact_table(market_claims, competitor_claims)`
10. `synthesize_report_from_fact_table(fact_table, idea)`
11. `verify_report_fields_against_fact_table(report)`
12. `attach_provenance_and_credibility(report, fact_table)`

Rules for these stages:
- Stages 1–9 are fact gathering and deterministic normalization first.
- Stage 10 may use an LLM, but only over the verified fact table plus explicit room for inferred strategy.
- Stage 11 must reject unsupported factual fields instead of silently repairing them.
- Stage 12 maps the internal truth model back into the current Validator report shape.

### 3. Make market sizing deterministic and evidence-bound

Replace freeform LLM market extraction with deterministic claim extraction from search results and source text.

Required behavior:
- Parse market size, CAGR, year, forecast year, units, and geography from evidence text before synthesis.
- Normalize all numeric formats (`M`, `B`, `T`, `%`, currency variants, `USD`, `million`, `billion`) into canonical units.
- Store both `raw_text` and `normalized_value`.
- Detect whether a claim refers to:
  - exact submarket
  - parent market
  - adjacent market
  - geography-limited market
- Disallow silent promotion of parent-market figures into the target niche.

Current fallback behavior to remove:
- hardcoded fallback values for market fields
- any logic that inserts pretty defaults for `current_tam`, `forecast_tam`, or `growth`

Replacement behavior:
- If no verified number exists, leave the current field populated only if there is an `estimated` value derived from clear logic.
- Otherwise populate the field with a visible unsupported marker while preserving the section shape.
- Add a human-readable reason in provenance metadata.

Derived-value policy:
- `estimated` is allowed only when based on verified inputs, such as forecast + CAGR + year math.
- Every estimated value must include `extraction_method = "derived"` and reference its parent claims.

Conflict policy:
- If multiple strong sources materially disagree, do not collapse to one clean number by default.
- Prefer a range or preferred-source value with a `conflict` note in provenance.
- Surface the disagreement in `credibility.conflicts_detected`.

### 4. Rebuild citations and provenance as claim-level support, not decorative links

Keep the current `citations` array, but change how it is generated.

Required behavior:
- `citations` must be sourced from claims actually used in the report, not just top search results.
- Every critical field in `market` and each key competitor fact must map to one or more provenance records.
- Add exact supporting quote snippets for:
  - `market.current_tam`
  - `market.forecast_tam`
  - `market.growth`
  - competitor funding
  - competitor pricing
  - competitor key weakness if source-backed

Frontend requirement:
- Keep the current citations section visible.
- Add drill-down capability for evidence display without removing the current section layout.

### 5. Replace hardcoded/stale competitor intelligence with sourced competitor resolution

Keep the current `competitors` array shape, but rebuild population logic.

Required backend changes:
- Deprecate direct overwrite from `GIANT_INTEL` for final report facts.
- If a competitor KB/cache is retained, each stored fact must carry:
  - `source_url`
  - `verified_on`
  - `expires_on`
  - `confidence`
- Distinguish:
  - direct competitors
  - adjacent incumbents
  - broad category leaders
- Require at least one relevance score per competitor to the user’s exact idea.

Competitor extraction pipeline:
1. extract named entities/domains from search results and snippets deterministically
2. cluster aliases and duplicates
3. score relevance to the exact niche
4. enrich funding/pricing/positioning through targeted search or cached verified records
5. mark unsupported competitor facts clearly instead of inventing them

Weakness rules:
- `weakness` may be `verified` only if backed by source evidence
- otherwise it must be `inferred`, with that status shown in provenance

Placeholder removal rule:
- final report must not use generic placeholders like `Industry Leader` as real competitors
- if no direct competitor is found, keep the competitor section shape but mark it explicitly as low-confidence competitor discovery

### 6. Constrain the LLM to synthesis and strategic interpretation only

Keep the current narrative-rich sections (`god_mode`, `dept_legal`, `dept_product`, `dept_marketing`, `dept_finance`), but fence them off from factual invention.

Rules:
- The LLM may generate:
  - `macro_verdict`
  - `swarm_summary`
  - department strategies
  - monetization interpretation
  - market timing rationale
- The LLM may not invent:
  - market numbers
  - competitor funding/pricing facts
  - years
  - counts
  - named source-backed claims outside the fact table

Prompt redesign:
- provide a compact verified fact table
- provide an explicit list of unsupported facts
- require the model to avoid filling unsupported factual fields
- require the model to mark strategic inferences separately from extracted facts

Verifier pass:
- after synthesis, run a field-level verification pass against the fact table
- if a factual field in the generated report cannot be matched to a verified or estimated claim, downgrade it to unsupported and preserve the section shell

### 7. Preserve the Validator UI structure while surfacing credibility and uncertainty

Do not remove or reorder the current major report sections. Add credibility cues around them.

Frontend work for `frontend/features/validator/Validator.tsx` and related components:
- preserve existing cards and report blocks
- add visual distinctions for `verified`, `estimated`, `inferred`, `unsupported`
- add a report-level credibility summary panel near the top:
  - verified field count
  - estimated field count
  - inferred field count
  - unsupported field count
  - source freshness
  - conflict warnings
- add inline provenance affordances on key values
- show exact source quotes on click/expand
- show explicit warnings when:
  - sources are stale
  - market numbers conflict
  - competitor discovery is weak
  - a section is strategy-heavy and fact-light

Rendering rules:
- never hide uncertainty behind polished styling
- unsupported values keep their slot in the report but render as unavailable with explanation
- estimated values display a label or badge
- inferred narrative sections display that they are synthesis, not direct evidence

Caching changes:
- keep cache behavior, but cache evidence metadata separately from synthesized narrative
- surface report age prominently
- invalidate or downgrade cached reports when source freshness window is exceeded

### 8. Reframe the DS layer as heuristic support and connect it more tightly to report evidence

Keep the DS cards and DS endpoint, but change product semantics.

Required changes:
- label DS outputs as heuristic/analytical support, not hard truth
- tie Monte Carlo assumptions to actual extracted report facts when available:
  - pricing model
  - target customer type
  - growth assumptions
  - burn assumptions
- where idea-specific inputs are missing, show fallback assumptions explicitly
- mark sentiment analysis as:
  - source-backed competitor signal
  - curated-KB fallback
  - sector fallback

Classifier plan:
- keep current classifier in place initially
- add calibration and feature-explanation output
- expose synthetic-data limitation in internal metadata and optionally UI copy
- do not let DS probabilities override grounded factual uncertainty in the main report

### 9. Standardize extension behavior without removing current extension-fed panels

Keep the current extension-enriched Validator experience, but normalize trust handling.

Extension contract changes:
- unify around one runtime contract; choose either `execute(payload)` sync wrapper or async `run(payload)` and adapt all extensions consistently
- every extension response must include:
  - `status`
  - `provenance_level`
  - `evidence_used`
  - `error_reason` if partial or failed

Extension policy:
- classify each extension output as sourced, inferred, or generated
- do not allow low-signal prompt-wrapper outputs to masquerade as grounded intelligence
- preserve existing extension panels in the Validator UI, but mark them clearly if they are strategy-generation rather than factual analysis

### 10. Align docs, schema, and runtime so the product claim matches reality

Update docs and runtime contracts so the current system is no longer claiming stronger truth guarantees than it actually enforces.

Required changes:
- align `README.md`, `PROJECT_STRUCTURE.md`, and internal comments with actual runtime stack
- align backend response schemas with frontend types
- version the Validator report schema
- define explicit API result states:
  - `complete`
  - `partial_grounded`
  - `partial_inferred`
  - `failed_validation`

Compatibility rule:
- existing frontend must continue to work during rollout
- new metadata fields are additive
- no current top-level Validator section is removed

## Public Interfaces and Type Changes

### `/analyze` response
Keep the existing Validator payload fields, but add:
- `credibility`
- `field_provenance`
- `evidence`
- `report_status`

Example additive shape:
- `credibility`: aggregate report trust metrics
- `field_provenance`: map from field path to provenance object
- `evidence`: normalized evidence claims and sources
- `report_status`: complete vs partial states

### Frontend types
Extend `RealData` to include:
- `credibility?: ReportCredibilityMeta`
- `field_provenance?: Record<string, FieldProvenance>`
- `evidence?: { sources: EvidenceSource[]; claims: EvidenceClaim[] }`
- `report_status?: "complete" | "partial_grounded" | "partial_inferred" | "failed_validation"`

No existing `RealData` keys should be removed or renamed.

## Test Plan

### Backend extraction and validation
- exact extraction of TAM/CAGR from straightforward source text
- normalization of million/billion/trillion and percent formats
- current vs forecast year alignment
- derived current TAM from verified forecast + CAGR
- rejection of unsupported market values when no evidence exists
- submarket vs parent-market mismatch detection
- stale-source downgrading
- multi-source conflict detection and annotation

### Competitor resolution
- direct competitor extraction from niche-market inputs
- deduping aliases and mirrored domains
- rejecting generic placeholders in final competitor lists
- competitor funding/pricing sourced independently
- marking inferred weaknesses correctly

### Synthesis guardrails
- LLM cannot introduce new unsupported market numbers
- verifier downgrades unsupported factual fields
- strategy sections still render when factual coverage is partial
- report remains structurally complete even when evidence is incomplete

### Frontend rendering
- all existing Validator sections remain visible
- badges/styles differ for verified, estimated, inferred, unsupported
- unsupported values show explanation instead of fake defaults
- provenance drilldown renders correct quote and source
- stale cache warning appears correctly
- conflict banner appears when conflicting source claims exist

### End-to-end acceptance scenarios
- strong-source idea: report mostly verified, minimal unsupported fields
- niche-market sparse-data idea: report honest, partial, visibly uncertain
- conflicting-market-data idea: report shows disagreement clearly
- no-good-source idea: report fails safely without fake TAM/CAGR
- cached report older than freshness window: report marked stale or downgraded
- competitor-poor idea: section preserved, but competitor confidence marked low

## Assumptions and Defaults

- The existing Validator report structure must remain intact at the top level; only additive metadata and UI affordances are allowed.
- “Desired report” means credible, auditable, uncertainty-aware, and trustworthy, not mathematically guaranteed correct on every idea.
- Core factual fields are limited to source-backed or explicitly derived values; training-knowledge-only values are not allowed for those fields.
- Narrative sections may remain model-generated, but must be clearly separated from verified facts.
- DS outputs remain part of the Validator experience, but are treated as analytical support rather than factual proof.
- Hardcoded static competitor intelligence may remain temporarily only as a cache with provenance and expiry; it must not silently overwrite final sourced facts.
- Rollout should be staged behind internal flags if needed, but the final implemented state should make strict credibility behavior the default.
