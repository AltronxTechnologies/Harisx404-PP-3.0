# Data Directory

Only manifests, schemas, checksums, tiny licensed test fixtures, and provenance
records belong in Git. Raw, interim, processed, exported, and private media are
ignored.

Planned structure:

```text
data/
├── manifests/
├── schemas/
├── raw/          # ignored
├── interim/      # ignored
├── processed/    # ignored
└── exports/      # ignored
```

Never add a dataset until provenance, license, privacy, and redistribution are
recorded in the Dataset Card.
