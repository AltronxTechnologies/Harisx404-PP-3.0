# ?? START HERE — Master Guide

> **STOP. Read this file first, every single session, before touching any code.**

This is the personal developer portfolio of **Haris (harisx404)** — rebuilt from a downloaded open-source template (originally by Braydon Coyer) into a fully dynamic, AI-powered, professional portfolio with a complete admin dashboard.

---

## ? Current Project Status

| Area | Status | Notes |
|---|---|---|
| Base template | ? Running | Braydon Coyer blogfolio, heavily modified |
| Content system | ?? Broken | Velite MDX errors on 10 blog files |
| Blogs | ?? Static files | 64 MDX files in content/blog/ — need DB migration |
| Projects | ?? Hardcoded | Only 2 projects, hardcoded in app/projects/page.tsx |
| Admin dashboard | ?? Not built | Does not exist yet |
| AI integration | ?? Not built | No AI anywhere |
| Image storage | ?? Local | Images in public/ — need Cloudinary |
| Database | ?? Supabase (free) | View counts + reactions only |
| Auth | ?? Supabase Auth | GitHub OAuth only — needs admin role |

---

## ?? Mandatory Reading Order (Every Session)

1. docs/00_START_HERE.md   ? This file
2. docs/02_WORKDONE.md     ? Last session state
3. docs/05_PHASES.md       ? Current phase tasks

Then read the relevant deep doc for todays task.

---

## ?? Quick Phase Reference

| Phase | Name | Status |
|---|---|---|
| Phase 0 | Audit, Docs, Plan | In Progress |
| Phase 1 | Database and Content Migration | Next |
| Phase 2 | Projects System (Dynamic) | Planned |
| Phase 3 | Admin Dashboard (Auth + CRUD) | Planned |
| Phase 4 | AI Integration | Planned |
| Phase 5 | Image and Media System | Planned |
| Phase 6 | Design Refresh and Personalization | Planned |
| Phase 7 | Performance, SEO and Launch | Planned |

---

## ? NEVER DO THESE

- Never hardcode data in component files (projects, skills, about info)
- Never commit .env.local or any real API keys
- Never delete the docs/ directory during git operations
- Never install packages not in docs/03_TECH_STACK.md without logging reason
- Never start Phase N+1 before completing Phase N checklist

---

## ? Starting a New Session Checklist

- [ ] Read this file (00_START_HERE.md)
- [ ] Read 02_WORKDONE.md to see last session state
- [ ] Read 05_PHASES.md current phase section
- [ ] Read the relevant deep doc for todays task
- [ ] Create an implementation plan before writing code
- [ ] Commit after each small logical unit of work
