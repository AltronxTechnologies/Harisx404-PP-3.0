# Search And Footer Route Coverage Audit

- Date: 2026-09-24
- Scope: public Search, Footer, dynamic content discovery, and sitemap coverage
- Status: complete and re-locked

## Canonical Coverage

Search and Footer both expose every canonical static page:

1. `/`
2. `/about`
3. `/blog`
4. `/buildlog`
5. `/community-wall`
6. `/contact`
7. `/credentials`
8. `/legal/privacy`
9. `/legal/terms`
10. `/links`
11. `/projects`
12. `/resume`

Both surfaces also expose `/rss.xml` and `/sitemap.xml`. Each of these 14
destinations returned HTTP 200 during the audit.

Published `/blog/[slug]` and `/projects/[slug]` pages are intentionally represented
by their collection roots in Footer and by live content results in Search. This
keeps the global Footer complete without turning it into an unstable duplicate of
the content database. Pagination, category filters, and Buildlog open-state query
parameters are states of canonical collection pages, not separate pages.

Admin, authentication, API, redirect-only legacy paths, retired routes, drafts,
future publications, crawler resources, and fallback-only outage records are not
public navigation destinations and are intentionally excluded.

## Corrections

- Dynamic Search now matches Blog and Project slugs as well as titles and summaries.
- Blog Search now requires `published_at` to be current or past.
- Blog Search now excludes local content records marked `draft: true`, matching the
  public index and detail-route contract.
- Sitemap now includes the canonical Contact and Resume pages.
- Added `tests/navigation-coverage.integration.test.mjs` and the
  `npm run test:navigation` command to prevent route-list drift.

## Verification

| Gate | Result |
|---|---|
| Canonical Search coverage | 14/14 |
| Canonical Footer coverage | 14/14 |
| Canonical destination responses | 14/14 HTTP 200 |
| Dynamic published slug search | Passed |
| Retired local-draft exclusion | Passed |
| Sitemap static-page coverage | 12/12 |
| Navigation coverage suite | 4/4 passed |
| Preview integration | 3/3 passed |
| Links integration | 2/2 passed |
| Home/About surface integration | 3/3 passed |
| TypeScript | Passed, 0 errors |
| Targeted ESLint | Passed, 0 errors |
| Application console errors | 0 |
| `git diff --check` | Passed |

## Lock Decision

Search and Footer now provide complete canonical public-route coverage. Dynamic
content discovery follows the same visibility rules as the public content routes,
and automated tests protect the contract from future drift.
