# WAAM Rights Policy

Version: 1.0
Effective: 2026-11-04
Status: Non-commercial research project

## 1. Purpose

This policy defines how World AI Art Museum (WAAM) handles rights related to AI-generated artworks. WAAM is a non-commercial research platform. We do not claim copyright over published images. We publish them for research, documentation, and study purposes, with full attribution and a documented legal basis.

## 2. Core separation

Three things are tracked independently and must never be conflated:

1. **Provenance** — evidence that the work was created with a generative AI model (levels A/B/C).
2. **Rights status** — permission to display the image on WAAM.
3. **Third-party IP risk** — risk that the image reproduces protected characters, styles, or trademarks.

A work with confirmed provenance (A) and unknown rights must NOT be published.

## 3. Provenance levels

| Level | Basis | Publication |
|---|---|---|
| A | Machine-verifiable evidence: API metadata, C2PA / Content Credentials manifest, signed generation log | Allowed after rights check |
| B | Author confirmation + model/generator identification | Allowed after rights check |
| C | Indirect or unconfirmed signals only | Not published |

Level A requires at least one evidence object of type `c2pa_manifest`, `api_response`, or `generation_log` stored in `provenance_evidence[]` with a SHA-256 hash.

## 4. Rights status values

| Status | Meaning | Allowed display |
|---|---|---|
| `confirmed` | Explicit permission to display the image on WAAM | Full image + passport |
| `external_link_only` | Only linking to the original is permitted | Thumbnail or link only, no full image |
| `unknown` | Rights not established | Not published |
| `denied` | Publication forbidden | Not published |

Every rights decision must record `rights_basis` — a URL or document identifier proving the decision. A decision without `rights_basis` is invalid and must be rejected by the pipeline.

## 5. Source jurisdiction

Rights status depends on the jurisdiction of the source:

- **US**: pure AI-generated output without human authorship is not copyrightable (Thaler v. Perlmutter). WAAM may display such works in a research context with attribution, but does not claim copyright.
- **EU**: protection requires human creative activity. WAAM treats pure AI output as research material, not as protected work.
- **UK**: computer-generated works may be protected under CDPA s.9(3). WAAM respects the source's stated terms.

The field `source_jurisdiction` must be recorded for every discovered item. If the jurisdiction's rules do not permit the chosen display mode, the item is downgraded to `external_link_only`.

## 6. Third-party IP risk

Every artwork must carry `third_party_ip_risk`: `low` | `medium` | `high` | `unknown`.

- `high` — image visibly reproduces a protected character, logo, or trademark. Not published without explicit rights confirmation.
- `medium` — style or subject resembles protected IP; manual review required.
- `low` — no visible third-party IP.
- `unknown` — not yet assessed. Treated as `medium` until reviewed.

## 7. Civitai and other source terms

- Civitai ToS grants a license for personal, non-commercial use. WAAM's research status is compatible with this.
- The connector MUST filter `nsfw=false` and record `allowCommercialUse` from the model metadata as `rights_hint` — a hint, not a decision.
- A snapshot of source terms (`source_terms_snapshot`) is stored at connection time with a timestamp, so that the terms in force at that date can be proven later.
- No source is accessed by circumventing its restrictions (no scraping against robots.txt, no bypassing API limits).

## 8. User-generated content and offer

By submitting an artwork, the author confirms that:
- they have the right to submit it;
- they grant WAAM a non-exclusive, non-commercial license to display it for research purposes;
- they understand that WAAM does not claim copyright and does not commercialize the image.

The full terms are in `OFFER.md`.

## 9. Takedown and corrections

Any author or rights holder may request correction or removal:
- via the contact listed in `OFFER.md`;
- WAAM aims to respond within 72 hours;
- a removed work is moved to the "Negative collection" (ID + reason, no image shown);
- the decision and reason are logged in `ingestion_logs`.

WAAM respects an explicit author opt-out even when the formal license would permit display.

## 10. Non-commercial status

At this stage WAAM is a non-commercial research project. Future commercialization (e.g., advertising) will be introduced as a separate layer and will not change:
- the rights status of already published works;
- the provenance levels;
- the non-exclusive license granted by authors.

Any future commercial use of a specific image would require a separate agreement with its author.
