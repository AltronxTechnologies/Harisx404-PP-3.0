import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Activity, ArrowUpRight, BookOpen, Briefcase, CalendarDays, Eye, FileText, Heart, HelpCircle, Image, MessageSquare, MousePointerClick } from "lucide-react";
import { requireAdmin } from "@/app/lib/admin-auth";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { getBuildTimeStats } from "@/app/lib/stats/build-time-stats";
import { getLighthouseStats } from "@/app/lib/stats/lighthouse-stats";
import { getServerStats } from "@/app/lib/stats/server-stats";
import type { ArticleMetric } from "@/app/lib/stats/types";

export const metadata: Metadata = { title: "Analytics | Admin" };
export const maxDuration = 60;

function Metric({ label, value, icon: Icon, href }: { label: string; value: string | number; icon: typeof Eye; href?: string }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-primary bg-bg-primary text-text-primary">
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink-primary">{value}</p>
    </>
  );
  const className = "rounded-2xl border border-border-primary bg-white/[0.03] p-5";
  return href ? <Link href={href} className={`${className} group transition-colors`}>{content}<ArrowUpRight aria-hidden className="mt-3 size-4 text-ink-secondary" /></Link> : <div className={className}>{content}</div>;
}

function TopArticles({ title, articles, unit, unavailable }: { title: string; articles: ArticleMetric[]; unit: "views" | "reactions"; unavailable: boolean }) {
  const total = articles.reduce((sum, article) => sum + Math.max(0, article.count), 0);
  const emptyMessage = unit === "views" ? "No article view data yet." : "No reaction data yet.";
  const unavailableMessage = unit === "views" ? "Article view analytics are temporarily unavailable." : "Reaction analytics are temporarily unavailable.";
  return (
    <section className="overflow-hidden rounded-2xl border border-border-primary bg-white/[0.03]">
      <header className="border-b border-border-primary/50 px-5 py-4">
        <h2 className="font-semibold text-ink-primary">{title}</h2>
        <p className="mt-1 text-xs text-ink-secondary">Each ring shows a share of the five articles listed, not all site {unit}.</p>
      </header>
      {articles.length ? (
        <ol className="divide-y divide-border-primary/30">
          {articles.map((article, index) => {
            const share = total > 0 ? Math.round((Math.max(0, article.count) / total) * 100) : 0;
            return (
              <li key={article.slug}>
                <Link href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer" className="flex min-h-[72px] items-center gap-3 px-5 py-3 text-sm transition-colors">
                  <span aria-hidden className="w-5 shrink-0 font-mono text-xs text-ink-secondary">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink-primary" title={article.title}>{article.title}</span>
                    <span className="mt-1 block font-mono text-xs text-ink-secondary">{article.count.toLocaleString("en-US")} {unit}</span>
                  </span>
                  <span role="img" aria-label={`${share}% of top five ${unit}`} className="relative flex size-12 shrink-0 items-center justify-center font-mono text-[10px] font-medium text-ink-primary">
                    <svg viewBox="0 0 40 40" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#414149" strokeWidth="3" />
                      {share > 0 && <circle cx="20" cy="20" r="16" fill="none" stroke="#e6e6e9" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray={`${share} 100`} />}
                    </svg>
                    <span aria-hidden="true">{share}%</span>
                  </span>
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-ink-secondary" />
                </Link>
              </li>
            );
          })}
        </ol>
      ) : <p className="px-5 py-6 text-sm text-ink-secondary">{unavailable ? unavailableMessage : emptyMessage}</p>}
    </section>
  );
}

function Score({ label, value }: { label: string; value: number | undefined }) {
  const score = value == null ? null : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rounded-xl border border-border-hairline bg-surface-base p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-secondary">{label}</span>
        <span className="shrink-0 font-mono text-sm font-semibold text-ink-primary">
          {score ?? "—"}{score != null && <span className="text-xs font-normal text-ink-secondary"> / 100</span>}
        </span>
      </div>
      {score != null && (
        <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-border-hairline">
          <div className={`h-full rounded-full ${score >= 90 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
        </div>
      )}
    </div>
  );
}

function CheckedAt({ value }: { value: string }) {
  return <time dateTime={value} className="mb-3 block font-mono text-[10px] text-ink-secondary">Checked {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(value))} UTC</time>;
}

async function attempt<T>(load: () => Promise<T>): Promise<{ data: T | null; failed: boolean }> {
  try {
    return { data: await load(), failed: false };
  } catch {
    return { data: null, failed: true };
  }
}

async function LighthouseHealth() {
  const result = await attempt(() => getLighthouseStats());
  const lighthouse = result.data || { mobile: null, desktop: null, partialFailure: true };
  const scoresUnavailable = !lighthouse.mobile && !lighthouse.desktop;

  return (
    <section className="rounded-2xl border border-border-primary bg-white/[0.03] p-5">
      <h2 className="font-semibold text-ink-primary">Lighthouse health</h2>
      <p className="mt-1 text-xs text-ink-secondary">Hourly mobile and desktop PageSpeed results when the production URL is reachable.</p>
      {scoresUnavailable && !lighthouse.partialFailure && !result.failed && (
        <p role="status" className="mt-4 rounded-xl border border-border-hairline bg-surface-base px-4 py-3 text-sm text-ink-secondary">
          {process.env.IS_ALLOY === "true" ? "PageSpeed scores are unavailable in the sandbox preview. They are fetched from the production site when deployed." : "PageSpeed scores are not available yet. Check the production URL and PageSpeed API access."}
        </p>
      )}
      {scoresUnavailable && (lighthouse.partialFailure || result.failed) && (
        <p role="status" className="mt-4 rounded-xl border border-border-hairline bg-surface-base px-4 py-3 text-sm text-ink-secondary">PageSpeed could not check the production site or API. Verify the site is reachable and retry after the hourly cache refresh.</p>
      )}
      {!scoresUnavailable && lighthouse.partialFailure && (
        <p role="status" className="mt-4 rounded-xl border border-border-hairline bg-surface-base px-4 py-3 text-sm text-ink-secondary">One device report is unavailable. The available scores are shown below.</p>
      )}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Mobile</h3>
          {lighthouse.mobile && <CheckedAt value={lighthouse.mobile.fetchedAt} />}
          <div className="grid gap-2 sm:grid-cols-2"><Score label="Performance" value={lighthouse.mobile?.performance} /><Score label="Accessibility" value={lighthouse.mobile?.accessibility} /><Score label="Best practices" value={lighthouse.mobile?.bestPractices} /><Score label="SEO" value={lighthouse.mobile?.seo} /></div>
        </div>
        <div>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Desktop</h3>
          {lighthouse.desktop && <CheckedAt value={lighthouse.desktop.fetchedAt} />}
          <div className="grid gap-2 sm:grid-cols-2"><Score label="Performance" value={lighthouse.desktop?.performance} /><Score label="Accessibility" value={lighthouse.desktop?.accessibility} /><Score label="Best practices" value={lighthouse.desktop?.bestPractices} /><Score label="SEO" value={lighthouse.desktop?.seo} /></div>
        </div>
      </div>
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const now = new Date().toISOString();
  const [serverResult, buildResult, ownerResult] = await Promise.all([
    attempt(() => getServerStats()),
    attempt(() => getBuildTimeStats()),
    attempt(async () => {
      const db = await createSupabaseAdminClient();
      const results = await Promise.all([
        db.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
        db.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published").gt("published_at", now),
        db.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
        db.from("messages").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("faqs").select("id", { count: "exact", head: true }).eq("is_visible", true),
        db.from("media").select("id", { count: "exact", head: true }),
      ]);
      return results.map(({ count, error }) => error ? null : count);
    }),
  ]);
  const server = serverResult.data;
  const build = buildResult.data;
  const hasDataFailure = serverResult.failed || buildResult.failed || ownerResult.failed || ownerResult.data?.includes(null) === true;
  const reactions = server?.reactionsByType || { like: 0, heart: 0, celebrate: 0, insightful: 0 };
  const reactionMax = Math.max(1, ...Object.values(reactions));
  const ownerCounts = ownerResult.data || [];
  const ownerSignals = [
    { label: "Draft articles", href: "/admin/blogs?status=draft", icon: FileText },
    { label: "Scheduled articles", href: "/admin/blogs?status=scheduled", icon: CalendarDays },
    { label: "Published projects", href: "/admin/projects", icon: Briefcase },
    { label: "Pending notes", href: "/admin/community-wall", icon: MessageSquare },
    { label: "Visible FAQs", href: "/admin/faqs", icon: HelpCircle },
    { label: "Tracked images", href: "/admin/media", icon: Image },
  ];

  return (
    <div data-admin-analytics className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Analytics</h1>
        <p className="text-sm text-ink-secondary">Private site activity, content performance, and operational health.</p>
      </div>
      {hasDataFailure && (
        <div role="alert" className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
          Some analytics sources are temporarily unavailable. Unknown values are shown as an em dash rather than zero.
        </div>
      )}

      <section aria-labelledby="analytics-overview">
        <h2 id="analytics-overview" className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-ink-secondary">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Article views" value={server ? server.totalViews.toLocaleString("en-US") : "—"} icon={Eye} />
          <Metric label="Reactions" value={server ? server.totalReactions.toLocaleString("en-US") : "—"} icon={Heart} />
          <Metric label="Published notes" value={server ? server.communityWallMessages : "—"} icon={MessageSquare} />
          <Metric label="Published articles" value={build ? build.totalArticles : "—"} icon={BookOpen} />
        </div>
      </section>

      <section aria-labelledby="analytics-owner-signals">
        <h2 id="analytics-owner-signals" className="font-semibold text-ink-primary">Owner signals</h2>
        <p className="mt-1 text-xs text-ink-secondary">Current managed-content and moderation counts. Visible FAQs may still be hidden by the homepage section setting.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ownerSignals.map((item, index) => (
            <Metric key={item.label} label={item.label} value={ownerCounts[index]?.toLocaleString("en-US") ?? "—"} icon={item.icon} href={item.href} />
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <TopArticles title="Top viewed articles" articles={server?.topViewedArticles || []} unit="views" unavailable={serverResult.failed} />
        <TopArticles title="Most reacted articles" articles={server?.topReactedArticles || []} unit="reactions" unavailable={serverResult.failed} />

        <section className="rounded-2xl border border-border-primary bg-white/[0.03] p-5">
          <div className="flex items-center gap-2"><MousePointerClick aria-hidden className="size-4 text-ink-secondary" /><h2 className="font-semibold text-ink-primary">Reaction breakdown</h2></div>
          {server ? (
            <div className="mt-5 space-y-4">
              {Object.entries(reactions).map(([name, value]) => (
                <div key={name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs"><span className="capitalize text-ink-secondary">{name}</span><span className="font-mono text-ink-primary">{value.toLocaleString("en-US")}</span></div>
                  <div aria-hidden className="h-2 overflow-hidden rounded-full bg-border-hairline"><div className="h-full rounded-full bg-accent-signal" style={{ width: `${(value / reactionMax) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 text-sm text-ink-secondary">Reaction analytics are temporarily unavailable.</p>}
        </section>

        <section className="rounded-2xl border border-border-primary bg-white/[0.03] p-5">
          <div className="flex items-center gap-2"><Activity aria-hidden className="size-4 text-ink-secondary" /><h2 className="font-semibold text-ink-primary">Content distribution</h2></div>
          <div className="mt-5 space-y-3">
            {build?.categoryBreakdown.length ? build.categoryBreakdown.map((category) => (
              <div key={category.name} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm">
                <span className="min-w-0 break-words text-ink-secondary" style={{ overflowWrap: "anywhere" }}>{category.name}</span>
                <span className="shrink-0 font-mono text-xs font-semibold text-ink-primary">{category.count}</span>
              </div>
            )) : <p className="text-sm text-ink-secondary">{buildResult.failed ? "Content analytics are temporarily unavailable." : "No category data yet."}</p>}
          </div>
        </section>
      </div>

      <Suspense fallback={<section className="min-h-[260px] rounded-2xl border border-border-primary bg-white/[0.03] p-5"><h2 className="font-semibold text-ink-primary">Lighthouse health</h2><p role="status" className="mt-3 text-sm text-ink-secondary">Checking production PageSpeed scores...</p></section>}>
        <LighthouseHealth />
      </Suspense>
    </div>
  );
}
