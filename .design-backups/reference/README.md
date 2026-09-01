# Design reference — single source of truth

This folder holds exactly **one** saved component version: the approved, locked
Reach Out ("Let's Connect") modal.

- `ReachOutModal.LOCKED.tsx` — byte-for-byte copy of the approved
  `app/components/navbar/ReachOutModal.tsx` at the moment it was locked.

**This is the reference the Search modal (⌘K) must be matched against** —
surfaces, radii, gaps, type scale, colour tokens, control sizes, motion and
the phone miniature system all come from here.

All earlier explorations (v1 original, v2/v3 glass drawer, v4 big glass) have
been deleted. Do not re-add alternate versions to this folder.

See `LOCKED_PERFECT.md` → entry 1 for the frozen spec and the audit results.
