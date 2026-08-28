# ?? Deployment Guide

---

## 1. Hosting: Vercel (Free Tier)

### Why Vercel
- Built for Next.js by the creators of Next.js
- Free tier: 100GB bandwidth, unlimited projects
- Automatic deploys on git push
- Preview deployments for every PR
- Environment variables UI
- Easy custom domain setup

### Setup
1. Go to https://vercel.com and sign in with GitHub
2. Click "New Project" ? Import your GitHub repo
3. Vercel auto-detects Next.js — click Deploy
4. Add environment variables (see section 3 below)

---

## 2. Complete Environment Variables

```env
# ===========================
# SUPABASE (Required)
# ===========================
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...

# ===========================
# CLOUDINARY (Required for media uploads)
# ===========================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your_secret

# ===========================
# ADMIN AUTH (Required for admin dashboard)
# ===========================
ADMIN_EMAIL=your-admin-email@gmail.com

# ===========================
# GOOGLE GEMINI AI (Required for AI features)
# ===========================
GOOGLE_AI_API_KEY=AIzaSy...

# ===========================
# SPOTIFY (Optional - for currently playing)
# ===========================
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# ===========================
# LOOPS.SO (Optional - for newsletter)
# ===========================
LOOPS_API_KEY=your_loops_key

# ===========================
# GITHUB (Optional - for stats)
# ===========================
GITHUB_TOKEN=ghp_xxxx

# ===========================
# PAGESPEED (Optional - for lighthouse stats)
# ===========================
PAGESPEED_API_KEY=your_key
```

---

## 3. Vercel Environment Variables Setup

1. Go to your Vercel project ? Settings ? Environment Variables
2. Add each variable above with its value
3. Set "Environment": Production + Preview + Development
4. For sensitive keys (SERVICE_ROLE_KEY, API secrets): Production only is fine

---

## 4. Custom Domain Setup

1. In Vercel project ? Settings ? Domains
2. Add your domain (e.g., harisx404.dev)
3. Vercel gives you DNS records to add
4. Go to your domain registrar ? DNS settings ? Add the records
5. Wait 5-30 minutes for DNS propagation
6. Vercel auto-enables HTTPS

### Recommended Domain Registrars
- Namecheap (~$10/year for .dev)
- Cloudflare Registrar (at-cost pricing, no markup)
- Google Domains (now Squarespace Domains)

---

## 5. Supabase Production Setup

### Database URL
Your Supabase database is already in the cloud — no extra setup needed for production.
Just make sure your production Vercel env vars have the correct Supabase URL.

### Supabase Free Tier Limits
| Resource | Free Limit |
|---|---|
| Database size | 500MB |
| Bandwidth | 5GB/month |
| Auth users | 50,000/month |
| Storage | 1GB |
| Edge Functions | 500K invocations/month |

A personal portfolio will stay well within these limits for years.

### When to Upgrade to Supabase Pro ($25/month)
- When database > 400MB
- When monthly bandwidth > 4GB
- When you need daily backups (Pro: point-in-time recovery)

---

## 6. Pre-Launch Checklist

- [ ] All environment variables added to Vercel
- [ ] Custom domain configured and HTTPS working
- [ ] siteMetadata.ts updated with production URL
- [ ] sitemap.ts generates correct production URLs
- [ ] robots.ts allows crawlers
- [ ] All "Braydon" references removed from site
- [ ] Admin dashboard works in production (/admin)
- [ ] Blog posts load correctly from Supabase
- [ ] Projects load correctly from Supabase
- [ ] Images load from Cloudinary (not public/)
- [ ] Lighthouse score 90+ on homepage
- [ ] No console errors in production
- [ ] Contact/newsletter form works
- [ ] Supabase RLS policies protecting write operations

---

## 7. Post-Launch Monitoring

- **Vercel Analytics** — Free, shows page views and performance
- **Supabase Dashboard** — Monitor database queries and auth
- **Cloudinary Dashboard** — Monitor media usage
- **Google Search Console** — Monitor SEO indexing

---

## 8. GitHub Workflow

### Branch Strategy
- `main` — production (auto-deploys to Vercel)
- `dev` — development (create PRs to main)
- `feature/phase-N-description` — feature branches

### Commit Convention
```
feat: add admin blog editor
fix: correct Supabase RLS policy for projects
chore: update environment variables
docs: add deployment guide
```

### Never Commit
- `.env.local`
- `.env` with real values
- `node_modules/`
- `.velite/` (generated)
- `.next/` (built files)
