# AUDIT_TESTING.md — the pre-lock audit protocol

**Trigger phrase: “Audit testing”.** When the owner says *“Audit testing <page/component>”*,
work through every phase in this file for that target, produce the report at the
bottom, fix what’s found, then ask for lock approval.

### Where the audit sits in the workflow
```
1. OWNER polishes the page/component to their satisfaction  ← design decisions
2. OWNER says "Audit testing <target>"                      ← audit starts HERE
3. Audit report -> owner vetoes anything unwanted
4. Fix approved items, one commit each
5. Re-verify, then LOCK
```
The audit is the **last** step before locking, not an ongoing activity. Do not
start auditing a target while the owner is still designing it — findings would
be about work in progress and waste both sides' time. Wait for the trigger.

Companion files:
- **`LOCKED_PERFECT.md`** — what is frozen. Entry 22 is the production freeze.
- **`DESIGN_DEBT.md`** — known open issues. **Phase 11 cross-checks it.**

---

## Working agreement

1. **One target at a time.** One page or one component per audit. No parallel work.
2. **One fix = one commit.** So any single change can be reverted on the spot
   without unpicking others. Never bundle unrelated fixes.
3. **Report before fixing.** List findings first so the owner can veto any of them.
4. **Nothing is “done” until measured.** No claiming a fix works without a
   command output or a browser measurement in the transcript.
5. **Locked areas are off-limits.** If a fix would touch entry 22 scope, STOP
   and ask. This includes indirect changes via shared modules, tokens or globals.
6. **Distinguish drift from intent.** Before changing anything for
   “consistency”, check the surrounding context. Deliberate variations exist —
   see Phase 10. Flattening them is a regression, not a fix.

### Revert procedure
```bash
git log --oneline -10                 # find the commit
git revert <sha>                      # single fix, safest
git revert <sha1> <sha2>              # several
```
Because every fix is its own commit, reverting one never disturbs the rest.

### Process rules (learned the hard way — do not repeat)
- **NEVER run `next build` while the dev server is up.** Both write the same
  `.next` volume and it corrupts the dev chunk map (`Cannot find module
  './vendor-chunks/…'` + 500s). Recovery:
  ```bash
  docker compose -f docker-compose.alloy.yaml exec -T web sh -lc 'rm -rf /workspace/.next/*'
  docker compose -f docker-compose.alloy.yaml restart web
  ```
- **NEVER run `prettier --write`.** The repo has `.prettierrc.json` but was never
  formatted with it. Running it creates a huge unrelated diff and touches locked
  files. Match surrounding style by hand.
- **Never scripted class edits that strip punctuation.** A regex that treats
  `dark:text-neutral-500"` as a token will eat the closing quote and break JSX.
  Operate on class *names* only; never touch whitespace, quotes or braces.
- **Playwright snapshots are huge.** Prefer `browser_evaluate` (returns only the
  value) over `browser_snapshot` when measuring.
- The page often resets to `about:blank` after HMR — re-navigate and wait ~3.3s
  for the navbar greeting→nav-links morph before interacting.

---

## THE REFERENCE BASELINE (from the locked components)

Everything new must match these. Source: `LOCKED_PERFECT.md` entry 22.

### Radius tiers
| Tier | Class | Use |
|---|---|---|
| 24px | `rounded-3xl` | Outer panel / card, modal controls |
| 16px | `rounded-2xl` | Inner rows, tiles, cards inside a panel, form inputs, buttons in modals |
| 12px | `rounded-xl` | Third level only when nested inside a 16px tile (e.g. navbar icon squares) |
| — | `rounded-full` | Circular icon containers, avatars, standalone pill buttons |

- **No arbitrary `rounded-[Npx]`** unless the value is off-scale *and* justified
  by the concentric rule below.
- **Concentric rule:** a nested radius should be `outer − padding`. This is why
  HomeBento legitimately has 20px+`p-2`→12px **and** 14px+`p-1`→10px.
- **Exception:** `rounded-md` (6px) is allowed on `<kbd>` keycaps.

### Colour tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `text-text-primary` | `#0f172a` | `#fafafa` | Headings, primary copy |
| `text-text-secondary` | `#5E5F6E` | `#a1a1a1` | Secondary copy, captions, meta |
| `border-border-primary` | `#D6DADE` | `white/10` | **All** dividers and card borders |
| `bg-primary` | `#F7F7F8` | `#0d0d0f` | Page background |

- **`text-text-tertiary` is BANNED for real text** — 2.25:1, fails AA.
  Permitted only for: decorative icons hidden until hover, and placeholders.
- **`border-`/`outline-text-tertiary` are fine** — UI-component contrast is a
  3:1 rule, not the 4.5:1 text rule.
- **Never tokenise text on a non-page background.** The token assumes page bg.
  Text on a dark chip, coloured banner, image overlay, inverted card, or the
  white resume sheet must keep its hand-tuned colour.

### Icon sizes
| Context | Size |
|---|---|
| Modal top-row controls | `size-8` (via `CONTROL_ICON`), stroke 2 |
| Modal pill / back chevron | `size-7` |
| Row icons | `size-6` |
| Trailing / clear icons | `size-5` |
| Navbar circle buttons | `size-4.5` (18px) |
| Share-menu items | `size-3.5` |

**Sibling icons in the same row must be the same size.** Unequal sibling sizes
is the single most common bug found so far.

### Shared modules — never re-implement
| Need | Use |
|---|---|
| Modal chrome | `app/components/navbar/modalSurfaces.ts` (`circleBtn`, `pillSurface`, `cardShell`, `CONTROL_ICON`) |
| GitHub/LinkedIn/X glyph | `app/components/BrandGlyph.tsx` (+ `normaliseBrand()`) |
| Theme toggle | `app/components/ThemeToggle.tsx` (`navCircleSurface`) |
| Kicker + heading | `app/components/home/SectionHeading.tsx` |
| Sliding arrow CTA | `app/components/home/DoubleArrow.tsx` |

### Locked modal geometry (for any new modal)
Overlay `fixed inset-0 z-[7000] flex items-end justify-center px-4 pt-4 pb-[15px]`,
wrapper `mx-3 w-[92vw] max-w-[792px]` + `.reachout-scale`, top row `mb-4 gap-[7px]`,
pill/controls `72px`, backdrop `bg-black/50 backdrop-blur-[3.85px]`,
entry `y:24, scale:0.96`, spring `stiffness:300 damping:30`.

---

## PHASE 1 — Scope & baseline
- [ ] State the exact target (route + component file list).
- [ ] `git status` clean before starting.
- [ ] Confirm target is **not** in `LOCKED_PERFECT.md` entry 22 scope.
- [ ] List which locked components appear on the page (navbar/footer/modals) —
      these are **reference only**, not to be modified.
- [ ] Read `DESIGN_DEBT.md` for known issues in this target.

## PHASE 2 — Static checks
```bash
docker compose -f docker-compose.alloy.yaml exec -T web npx tsc --noEmit
docker compose -f docker-compose.alloy.yaml exec -T web npx eslint <target files>
```
- [ ] `tsc`: **0 errors**.
- [ ] eslint: **0 errors** (baseline warnings: ~10 pre-existing `<img>` + 1 hook dep).
- [ ] No unused imports / dead state left behind.
- [ ] No `console.log` / commented-out blocks / TODOs shipped.

## PHASE 3 — Does it even run
```bash
for u in <routes>; do printf "%-24s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$u)"; done
```
- [ ] Every route **200**.
- [ ] `browser_console_messages`: no errors, no hydration warnings, no 404s
      for assets.
- [ ] No layout shift on load (CLS): check the hero doesn’t jump.

## PHASE 4 — Design-system conformance
- [ ] **Radii** — every value on the tier scale, or justified by the concentric rule.
      ```bash
      grep -no 'rounded-[a-z0-9\[\]]*' <file> | awk -F: '{print $2}' | sort | uniq -c
      ```
- [ ] **Arbitrary radii count is 0** unless justified in the report.
- [ ] **Colours** — no hardcoded grey for secondary copy on page background.
      ```bash
      grep -n 'text-neutral-[3-7]00\|text-gray-[3-7]00\|dark:text-white/[456]0' <file>
      ```
- [ ] **Banned token** — `text-text-tertiary` used only for decorative/placeholder.
- [ ] **Dividers** use `border-border-primary`.
- [ ] **Typography** — sizes/weights drawn from the existing scale, no one-off px.
- [ ] **Spacing** — gaps consistent with siblings; no magic numbers.

## PHASE 5 — Duplicate-control check ⚠️ HIGH VALUE
This class of bug caused the original theme-toggle defect. Always run it.
- [ ] Is any control here **already** a shared component? (see table above)
- [ ] Is any style string **copy-pasted** from another file? If yes, extract it.
- [ ] Do sibling icons in a row have **equal** sizes?
- [ ] Any component/function **name collision** with an existing one?
      ```bash
      grep -rn "function <Name>" app/
      ```
- [ ] Any duplicated SVG path data that `BrandGlyph` already owns?

## PHASE 6 — Both themes
- [ ] Light mode: screenshot + no invisible/washed-out text.
- [ ] Dark mode: same.
- [ ] Every colour has a `dark:` counterpart **or** uses a token.
- [ ] No element relies on a colour that only works in one theme.

## PHASE 7 — Accessibility
- [ ] **Contrast AA**: run the probe (below). 0 real failures. Note that
      `sr-only` text and gradient-background elements are false positives.
- [ ] **Keyboard**: Tab order logical; all interactive elements reachable.
- [ ] **Focus visible** on every control.
- [ ] **Modals/dialogs**: focus trap wraps both directions, `Escape` closes,
      focus restored to the opener, `tabIndex={-1}` on the container.
- [ ] **Touch targets ≥ 24×24px** (WCAG 2.5.8); use a `before:-inset-*`
      extension rather than resizing the visual box.
- [ ] **Draggable controls have one keyboard stop.** Framer can add
      `tabindex="0"` to a draggable child automatically; inspect rendered DOM,
      not only JSX, and ensure a labelled wrapper does not gain an unnamed
      second stop.
- [ ] **Semantics**: correct heading order, `aria-label` on icon-only buttons,
      `aria-live` on async status, `alt` on meaningful images, no duplicate SVG
      fragment IDs when responsive copies are both present in the DOM.
- [ ] **No hydration flash** — theme-dependent UI must be `mounted`-guarded.
- [ ] Respects `prefers-reduced-motion` if it animates.

## PHASE 8 — Responsive
Check at **1440×900**, **1024×768**, **768×1024**, **390×844**, **375×667**, **360×640**.
- [ ] No horizontal overflow at any width.
- [ ] No child is clipped by an `overflow-hidden` card. Page-level
      `scrollWidth` can still be zero when oversized children are cut off;
      compare the outermost child rectangles with the card bounds.
- [ ] No text clipping / overlap.
- [ ] Tap targets still ≥24px on the smallest.
- [ ] Font sizes remain legible (flag anything under ~11px).
- [ ] Images/aspect ratios hold.

## PHASE 9 — States & interaction
- [ ] **Empty** state designed (not a blank area).
- [ ] **Loading** state (skeleton/spinner) present for async.
- [ ] **Error** state present and readable.
- [ ] **Hover / active / disabled** all defined and distinguishable.
- [ ] **Long content**: does a long title/name break layout? Test overflow.
- [ ] **Zero / one / many** data cases.
- [ ] Timers, intervals and listeners **cleaned up** on unmount (memory leak check).
- [ ] Every link resolves — no dead `href`, no unlistened dispatched events.
      ```bash
      grep -rn "dispatchEvent(new CustomEvent" app/   # confirm a listener exists
      ```

## PHASE 10 — Intentional-variation guard
Before reporting anything as an inconsistency, confirm it is **not** deliberate:
- [ ] Is the background non-page (dark chip / gradient / image / inverted card)?
- [ ] Is it a designed variant behind a prop (like `TechChip`’s `pill`)?
- [ ] Is it an animation endpoint rather than a static token?
- [ ] Is the nested radius explained by `outer − padding`?
- [ ] Is a smaller size proportionally correct for a smaller element?
- [ ] Is there a code comment already explaining it?

If any answer is yes → **document it, don’t change it.** Add it to the lock
entry’s “intentional variations” list.

## PHASE 11 — Cross-check `DESIGN_DEBT.md`
- [ ] Does this target contain any open debt item? Fix it now, before locking.
- [ ] Remove fixed items from `DESIGN_DEBT.md` in the same commit.
- [ ] Add any newly-found issue that is **out of scope** for this audit.

## PHASE 12 — Report, fix, lock
- [ ] Produce the report (template below).
- [ ] Owner reviews and vetoes anything unwanted.
- [ ] Fix approved items — **one commit each**.
- [ ] Re-run Phases 2, 3, 6, 7 to confirm no regression.
- [ ] On owner approval: append a `LOCKED_PERFECT.md` entry including the
      **intentional variations** list, then commit + push + merge.

---

## Reusable probes

### Contrast (paste into `browser_evaluate`)
```js
() => {
  const lum = c => { const [r,g,b]=c.match(/\d+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}); return 0.2126*r+0.7152*g+0.0722*b; };
  const ratio = (a,b) => { const l1=lum(a),l2=lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  const bgOf = el => { let n=el; while(n){ const b=getComputedStyle(n).backgroundColor; if(b&&b!=='rgba(0, 0, 0, 0)'&&!/, 0\)$/.test(b)) return b; n=n.parentElement; } return 'rgb(255,255,255)'; };
  const out=[]; let fails=0;
  document.querySelectorAll('p,span,div,time,li,a,h1,h2,h3,h4,button').forEach(el=>{
    if(!el.textContent?.trim() || el.children.length) return;
    const s=getComputedStyle(el);
    if (s.visibility==='hidden' || s.display==='none') return;
    const r=ratio(s.color,bgOf(el));
    const size=parseFloat(s.fontSize), bold=parseInt(s.fontWeight)>=700;
    const min=(size>=24||(size>=18.66&&bold))?3:4.5;
    if(r<min){ fails++; if(out.length<10) out.push({t:el.textContent.trim().slice(0,32),color:s.color,ratio:+r.toFixed(2),need:min}); }
  });
  return { theme:document.documentElement.classList.contains('dark')?'dark':'light', fails, out };
}
```

### Sibling icon-size equality
```js
() => [...document.querySelectorAll('<row selector>')].map(row =>
  [...row.querySelectorAll('svg')].map(s => {
    const r = s.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}`;
  })
)
```

### Section-gap measurement — MUST validate before trusting
A naive "walk up from the heading" probe compares elements at different nesting
depths and produces garbage gaps. It once reported a 325px first-section gap on
/about that did not exist: the real value was 112px, set by `space-y-28`, the
same utility the home page uses.

**Rule: the probe must return `siblings: true`. If it returns false, the numbers
are invalid - fix the selector, do not report the gap.**
```js
() => {
  const pairs=[...document.querySelectorAll('h2')]
    .filter(h=>parseFloat(getComputedStyle(h).fontSize)>=40)
    .map(h=>({h,k:h.previousElementSibling})).filter(x=>x.k&&x.k.tagName==='P');
  const wraps=pairs.map(p=>p.k.parentElement);
  const chain=el=>{const a=[];let n=el;while(n){a.push(n);n=n.parentElement;}return a;};
  const lca=chain(wraps[0]).find(c=>wraps.every(w=>c.contains(w)));
  const blocks=wraps.map(w=>{let n=w;while(n.parentElement&&n.parentElement!==lca)n=n.parentElement;return n;});
  const b=blocks.map(x=>x.getBoundingClientRect()), gaps=[];
  for(let i=1;i<b.length;i++) gaps.push(Math.round(b[i].top-(b[i-1].top+b[i-1].height)));
  return { siblings: blocks.every(x=>x.parentElement===lca), gaps };  // siblings MUST be true
}
```
**Shortcut:** section rhythm is usually one `space-y-*` on a single wrapper.
Grep for it first - `grep -n "space-y-" <page>` - which is cheaper and exact.

### Radius sweep
```js
() => { const m={}; document.querySelectorAll('<scope> *').forEach(e=>{
  const r=getComputedStyle(e).borderTopLeftRadius; if(r!=='0px') m[r]=(m[r]||0)+1; }); return m; }
```

### Focus-trap check
```js
async () => {
  const dlg=document.querySelector('[role="dialog"]'); if(!dlg) return 'NO_DIALOG';
  const f=[...dlg.querySelectorAll('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])')];
  return { count:f.length, first:f[0]?.getAttribute('aria-label'), last:f.at(-1)?.getAttribute('aria-label'),
           container:dlg.getAttribute('tabindex') };
}
```

---

## Report template

```markdown
# Audit testing — <target>
Date: · Commit: · Routes:

## Verdict
[ ] Production-ready, safe to lock
[ ] Fix N items first
[ ] Needs owner decision on N items

## 🔴 Blockers (broken / inaccessible / dead)
| # | Finding | file:line | Evidence |

## 🟠 Consistency vs locked baseline
| # | Finding | Current | Baseline | file:line |

## 🟡 Polish

## 🟢 Intentional — NOT changing (with reason)
| # | Thing | Why it is correct |

## ❓ Owner decision needed

## Evidence
- tsc: · eslint: · routes: · contrast light/dark:
- viewports checked: · console:
```

---

## Audit log

| # | Target | Date | Result | Lock entry |
|---|---|---|---|---|
| — | Home, Navbar, Search modal, Reach Out modal, Footer | 2026-09-04 | Final owner re-lock through `d1b496d` | entry 24 |
| 1 | **About page** | 2026-09-04 | Passed 12-phase audit and received final owner approval | entry 24 |
| 2 | **Projects index** | 2026-09-04 | Passed production audit and received final owner approval | entry 24 |
| 3 | **Blog index** | 2026-09-04 | UI/behavior audit passed; awaiting owner review and content-ownership decision | pending |

---

## This protocol is a LIVING DOCUMENT

The owner's instruction: *“I will add more pages when I polish it, so more
perfect data will be you have to make the audit more perfect.”*

Every locked area makes the baseline richer and the audit sharper. **After each
audit, update this file** — do not let it go stale.

### Post-audit maintenance (mandatory, part of Phase 12)
1. **Extend the reference baseline** with any new value the newly-locked area
   establishes (a new spacing rhythm, a card pattern, a state style, an
   animation timing). Prefer extracting real values from the code over
   describing them in prose.
2. **Add any new check** that would have caught a bug this audit found. If a
   defect slipped through the 12 phases, the phases were incomplete — fix them.
3. **Add every intentional variation** discovered, with its reason, so a later
   pass cannot flatten it.
4. **Record the audit** in the log above.
5. **Note anything that wasted time**, so it becomes a process rule.

### Baseline growth log
Track where each reference value came from, so its authority is traceable.

| Baseline element | Source | Added |
|---|---|---|
| Radius tiers 24/16/12 + concentric rule + kbd exception | Reach Out & Search modals, Navbar dropdown | 2026-09-01 (entry 22) |
| Colour tokens + “token assumes page background” rule | `globals.css` + the 310-usage colour audit | 2026-09-01 |
| Icon size scale | Modal top rows, navbar circles, share menus | 2026-09-01 |
| Shared-module list | `modalSurfaces.ts`, `BrandGlyph.tsx`, `ThemeToggle.tsx` | 2026-09-01 |
| Locked modal geometry (792px / 72px / 7px / 634px) | Reach Out v5, Search v2 | 2026-09-01 |
| Long-page section rhythm: 16px kicker gap / 56px content gap / 112px sections | About page + Home reference | 2026-09-02 |
| About content prose: 15px/400; card subtitles remain 14px mobile → 16px md | About hero, Experience, Education, bento baseline | 2026-09-02 |
| Theme-aware paper hero: local image, multiply light / inverted screen dark | `PaperHeroTexture.tsx` | 2026-09-02 |
| Rendered-DOM checks for draggable tabindex and duplicate SVG IDs | About scrapbook + Education posters | 2026-09-02 |

### Still thin — strengthen as data arrives
Honest gaps in the current baseline. Fill these from real locked pages rather
than inventing conventions:
- **Section spacing rhythm** for long content pages (the home page has one, but
  it has not been extracted into measurable numbers here).
- **Page-hero pattern** — still unresolved across 10 pages, and the top-spacing
  question is open. See `DESIGN_DEBT.md` Issue 4.
- **Card taxonomy** — is a content card 16px or 24px? The home page uses both.
  Needs a ruling once About is locked.
- **Chip / tag scale** — 9 recipes exist site-wide; the locked pages contain
  deliberate variants, so the canonical set is not yet decided.
- **Table / list / form patterns** — no locked example yet.
- **Empty / loading / error state styling** — no canonical version yet.
