# 05 — Data & Seeding Log (random/placeholder data currently live)

## Already seeded in Supabase (live)
- 63 blog posts (published)
- 3 projects: intrushield-nids, medicalink-hms, packetvision-network-sniffer
- Testimonials (6), experience, education, certifications, tools

## Random/placeholder data added THIS session (owner to refine later)
| Where | What | How to change |
|---|---|---|
| projects.start_date | 2026-04-10 / 2025-09-15 / 2025-02-05 (→ Q2 26, Q3 25, Q1 25) | Admin panel |
| projects.features | 3 written ✦ bullets per project | Admin panel |
| Hero strip slots 2–4 | Unsplash stock (code/city/mountain) | HomeHero.tsx ✏️ EDIT |
| About photo stack | Unsplash stock (mountains/gym) + portrait | AboutTeaser.tsx ✏️ EDIT |
| Bucket list | 15 placeholder goals in 3 groups | site-content.ts ✏️ EDIT |
| contact.calLink | "" (email fallback shown) | site-content.ts ✏️ EDIT |

## Still empty / needs seeding to fully exercise UI  🔴
- [ ] blog_posts.cover_image_url — all null (cards use gradient fallback) ❓ seed stock covers?
- [ ] testimonials.avatar_url — null (initials shown) ❓ seed stock avatars?
- [ ] projects.cover screenshots — verify all 3 have real cover_image_url
- [ ] 2 more projects to reach reference's 5-card density (owner content) 📦
