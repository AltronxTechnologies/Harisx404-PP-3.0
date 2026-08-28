# ?? AI Agent Rules — MANDATORY

**STOP. Read this entire file before writing any code.**
These rules exist because AI agents have repeatedly caused problems by ignoring them.

---

## RULE 0: NEVER DELETE docs/

The docs/ directory is the project blueprint. NEVER delete it.
Before any git operation, verify docs/ files are not staged as deleted.

```bash
git status
# If docs/ shows as deleted:
git restore docs/
```

---

## RULE 1: READ DOCS FIRST, CODE SECOND

Every session, before writing any code:
1. Read docs/00_START_HERE.md
2. Read docs/02_WORKDONE.md (current state)
3. Read docs/05_PHASES.md (current phase tasks)
4. Read the relevant deep doc for todays task

If you skip this step and write code, you are violating this rule.

---

## RULE 2: ONE PHASE AT A TIME

- Never start Phase N+1 before Phase N checklist is 100% complete
- Never do work from Phase 3 while on Phase 1
- If user asks for something from a future phase, note it in 02_WORKDONE.md and continue the current phase

---

## RULE 3: NO HALLUCINATION

- Only build features explicitly listed in docs/05_PHASES.md
- Only install packages listed in docs/03_TECH_STACK.md
- If you are unsure about a requirement, ASK before implementing
- Never invent database columns or API fields not in docs/06_DATABASE_DESIGN.md

---

## RULE 4: NO HARDCODING DATA

- NEVER hardcode content (project names, bio text, skills lists) directly in component files
- ALL content must come from the database (Supabase) or site settings
- Exception: Design tokens and layout constants (max-width, spacing) are okay in CSS/code

---

## RULE 5: COMMIT OFTEN, IN SMALL PIECES

- Commit after each small, logical unit of work
- NEVER make one giant commit at the end of a session
- Commit format: `type(scope): short description`
- After committing, push to GitHub

```
feat(blog): add blog list query from Supabase
fix(admin): correct middleware auth check
chore(db): run migration for blog_posts table
```

---

## RULE 6: NEVER COMMIT SECRETS

- NEVER commit .env.local or any file containing real API keys
- Check .gitignore includes: .env.local, .env, .env.*.local
- If you accidentally staged a secret, unstage it before committing

---

## RULE 7: ENVIRONMENT VARIABLES MUST EXIST

- If a feature requires an env var, add it to .env.local (with a placeholder)
- Add it to docs/12_DEPLOYMENT_GUIDE.md env section
- Never make a feature fail silently due to missing env vars — throw a clear error

---

## RULE 8: UPDATE WORKDONE AFTER EACH SESSION

Before ending any session:
1. Update docs/02_WORKDONE.md with what was done
2. Update docs/05_PHASES.md task checkboxes
3. Commit everything
4. Push to GitHub

---

## RULE 9: TEST BEFORE CALLING DONE

A task is NOT done until:
- `npm run dev` starts without errors
- The relevant page/feature works in the browser
- No TypeScript errors (run: npx tsc --noEmit)
- No console errors in browser

---

## RULE 10: ASK BEFORE BREAKING CHANGES

If your implementation requires:
- Changing the database schema
- Removing existing features
- Changing URL structure (breaking existing links)
- Installing a new major dependency

Then STOP and ask the user for approval before proceeding.

---

## FORBIDDEN ACTIONS (Without User Approval)

- Installing any package not in docs/03_TECH_STACK.md
- Changing the database schema without documenting in docs/06_DATABASE_DESIGN.md
- Removing the Velite system before Phase 1 blog migration is verified complete
- Changing the URL structure of existing pages (/blog, /projects, etc.)
- Deleting content files in content/blog/ before migration is verified
- Making design changes (colors, fonts, layout) before Phase 6

---

## QUICK REFERENCE: Phase Rules

| Phase | What You CAN Do | What You CANNOT Do |
|---|---|---|
| Phase 0 | Personalize text, fix Velite errors, set up Supabase connection | Change page layouts, add new features |
| Phase 1 | DB schema, migration, update blog pages to use DB | Admin dashboard, AI, new pages |
| Phase 2 | Projects pages, projects DB queries | Admin CRUD, AI features |
| Phase 3 | Admin dashboard, CRUD forms, media upload | AI features, design changes |
| Phase 4 | AI features (Gemini, chatbot, search) | Design changes |
| Phase 5 | Cloudinary setup, image migration | Design changes |
| Phase 6 | Design changes (user-directed, one at a time) | New feature additions |
| Phase 7 | Performance, SEO, deployment | New features |
