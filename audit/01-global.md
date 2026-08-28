# 01 — Global / Shared Elements

## Navbar
- [x] ✅ Greeting state at top of page ("Good Evening" + moon), pill nav appears on scroll
- [x] ✅ Pill nav items: Home · About · Work · Blog · More ▾ · Book a Call
- [x] ✅ Search button (⌘K) + theme toggle to the right of the pill
- [x] ✅ Book a Call opens the Reach Out overlay (verified against reference behavior)
- [x] ✅ More dropdown hides search/theme instantly, restores with delay
- [ ] 🔴 Compare pill nav exact height/padding/blur values at 1440px against reference
- [ ] 🔴 Compare active-tab underline indicator thickness/offset

## Footer
- [x] ✅ 4-block layout: logo+blurb, General, Specifics, More
- [x] ✅ Bucket List added to Specifics (reference position)
- [x] ✅ Book a call added to More (reference position)
- [x] ✅ Bottom row: © line + Privacy/Terms/Sitemap
- [ ] ❓ DECISION: our More column carries extra links (Stats, Connections, Speaking) — keep or trim?
- [ ] 🔴 Compare hover arrow reveal on footer links vs reference micro-interaction

## Theme / tokens / type
- [x] ✅ Dark-first near-black theme + light mode toggle
- [x] ✅ Serif display font with gradient-italic accent words
- [x] ✅ Mono uppercase kickers site-wide (CSS `uppercase`)
- [ ] ⚠️ Typeface files differ from reference (our Instrument Serif + Geist) — accepted delta
- [ ] 🔴 Side-by-side check of gradient accent hue stops vs reference purple→magenta→pink

## Shared overlays (verified this session with pixel measurements)
- [x] ✅ Reach Out modal: 660px shell, 18→16vh top, detached top bar, card ring/radius/padding
- [x] ✅ Search modal: IDENTICAL geometry to Reach Out (bar top/left/width matched to the pixel)
- [x] ✅ Both share `.reachout-scale` (top-origin) so they scale identically on short screens
- [x] ✅ Search sections: Pages (2-col, active dot) / Connect / Legal / Discover + our Content search
- [ ] 🔴 Compare modal open/close spring curves vs reference timing
