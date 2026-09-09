# Dataset Source Research

Date reviewed: 2026-09-09

Status: `EVALUATED`

No media was downloaded during this review. A public listing or download button
is not treated as permission. Every selected file must retain its source page,
creator, license, verification date, checksum, attribution, modifications,
privacy review, and source-group identity.

## Preferred Source Strategy

1. Use file-level Creative Commons warehouse/forklift media from Wikimedia
   Commons where the description page records creator and license.
2. Use individually verified Open Images files only when the original image
   license and attribution metadata remain available.
3. Consider explicitly licensed Roboflow datasets only after preserving the
   displayed license/version and accepting the documented upstream-provenance
   limitation; do not claim image-by-image provenance that is absent.
4. Keep construction/PPE domain supplements in training only and preserve an
   unseen fixed-camera warehouse viewpoint for test.

## Candidate Sources

| Source | Declared license | Intended contribution | Decision |
|---|---|---|---|
| Forklift Safety Dataset, Roboflow Universe version 2 | CC BY 4.0 | Small industrial seed with all four source labels | BLOCKED pending export access, source review, and annotation-semantic audit |
| Construction Site Safety Dataset, raw version 30 | CC BY 4.0 | Person/worn-hardhat/worn-vest training supplement | BLOCKED pending export access and upstream-provenance acceptance |
| Safety Vests Dataset, unaugmented version 7 | CC BY 4.0 | Worn-vest training supplement | BLOCKED pending export access and box-semantics review |
| Open Images V7 selected files | Images listed CC BY 2.0; annotations CC BY 4.0 | Person diversity, hard negatives, manually screened hardhats | BLOCKED until each image license is individually verified |
| Harvard Dataverse Hardhat, DOI 10.7910/DVN/7CBGOS | CC0 1.0 | Hardhat candidate pool | BLOCKED until archive contents, semantics, and upstream provenance are inspected |
| Wikimedia Commons warehouse/forklift files | File-specific CC BY/CC BY-SA | Warehouse context, forklifts, hard negatives, evaluation candidates | PLANNED for file-by-file manifesting and privacy screening |

Relevant official pages:

- https://universe.roboflow.com/iosh-example/forklift-safety-pzloa/dataset/2
- https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety/dataset/30
- https://universe.roboflow.com/roboflow-universe-projects/safety-vests/dataset/7
- https://storage.googleapis.com/openimages/web/download_v7.html
- https://doi.org/10.7910/DVN/7CBGOS
- https://commons.wikimedia.org/wiki/Category:Videos_of_warehouses
- https://commons.wikimedia.org/wiki/Category:Forklifts

## Rejected Sources

- SHWD: repository software license does not establish rights for Google/Baidu
  image pixels.
- Generic user-uploaded forklift dataset mirrors: no defensible upstream source
  manifest.
- MakeML Hard Hat Workers, Pictor-v3, and GDUT-HWD: no sufficiently clear
  authoritative pixel-redistribution grant was verified.
- Surveillance/crime datasets and arbitrary YouTube footage: privacy,
  sensitivity, or redistribution terms conflict with this project's policy.
- Stock-site frame extraction: site terms may allow use but restrict dataset-like
  redistribution.

## Current Gate

Phase 2 tooling is evaluated, but acquisition remains `BLOCKED` until a complete
source set can pass `visionshield-data-audit` against real local media. Roboflow
annotation/export also requires workspace access that is not present in the
sandbox. These are external evidence dependencies, not code defects.

## Access Verification

On 2026-09-09, all three selected Roboflow Universe pages returned HTTP 403 to
the sandbox fetcher and the official Roboflow API returned HTTP 401 without an
API key. No `ROBOFLOW_API_KEY` is available. No attempt was made to bypass these
controls. Wikimedia Commons' official API was reachable and returned file-level
license metadata for forklift, hard-hat, and high-visibility-clothing categories;
those files remain candidates because full-resolution privacy and ontology review
has not occurred.
