import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, BookOpen, Eye, Heart, MessageSquare, MousePointerClick } from "lucide-react";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getBuildTimeStats } from "@/app/lib/stats/build-time-stats";
import { getLighthouseStats } from "@/app/lib/stats/lighthouse-stats";
import { getServerStats } from "@/app/lib/stats/server-stats";

export const metadata: Metadata = { title: "Analytics | Admin" };

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Eye }) {
  return (
    <div className="rounded-2xl border border-border-primary bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-primary bg-bg-primary text-text-primary">
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink-primary">{value}</p>
    </div>
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

async function attempt<T>(load: () => Promise<T>): Promise<{ data: T | null; failed: boolean }> {
  try {
    return { data: await load(), failed: false };
  } catch {
    return { data: null, failed: true };
  }
}

export default async function AdminAnalyticsPage() {
  const auth = await requireAdmin();
  if (auth.response) redirect(auth.response.status === 401 ? "/admin/login" : "/");
  const [serverResult, buildResult, lighthouseResult] = await Promise.all([
    attempt(() => getServerStats()),
    attempt(() => getBuildTimeStats()),
    attempt(() => getLighthouseStats()),
  ]);
  const server = serverResult.data;
  const build = buildResult.data;
  const lighthouse = lighthouseResult.data || { mobile: null, desktop: null, partialFailure: true };
  const hasDataFailure = serverResult.failed || buildResult.failed || lighthouseResult.failed || lighthouse.partialFailure;
  const reactions = server?.reactionsByType || { like: 0, heart: 0, celebrate: 0, insightful: 0 };
  const reactionMax = Math.max(1, ...Object.values(reactions));
  const scoresUnavailable = !lighthouse.mobile && !lighthouse.desktop;

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

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border-primary bg-white/[0.03]">
          <header className="border-b border-border-primary/50 px-5 py-4"><h2 className="font-semibold text-ink-primary">Top viewed articles</h2></header>
          <div className="divide-y divide-border-primary/30">
            {server?.topViewedArticles.length ? server.topViewedArticles.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 text-sm transition-colors">
                <span className="min-w-0 truncate font-medium text-ink-primary">{article.title}</span>
                <span className="shrink-0 font-mono text-xs text-ink-secondary">{article.count.toLocaleString("en-US")} views <ArrowUpRight aria-hidden className="ml-1 inline size-3" /></span>
              </Link>
            )) : <p className="px-5 py-6 text-sm text-ink-secondary">{serverResult.failed ? "Article view analytics are temporarily unavailable." : "No article view data yet."}</p>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border-primary bg-white/[0.03]">
          <header className="border-b border-border-primary/50 px-5 py-4"><h2 className="font-semibold text-ink-primary">Most reacted articles</h2></header>
          <div className="divide-y divide-border-primary/30">
            {server?.topReactedArticles.length ? server.topReactedArticles.map((article) => (
              <Link key={article.slug} href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 text-sm transition-colors">
                <span className="min-w-0 truncate font-medium text-ink-primary">{article.title}</span>
                <span className="shrink-0 font-mono text-xs text-ink-secondary">{article.count.toLocaleString("en-US")} reactions <ArrowUpRight aria-hidden className="ml-1 inline size-3" /></span>
              </Link>
            )) : <p className="px-5 py-6 text-sm text-ink-secondary">{serverResult.failed ? "Reaction analytics are temporarily unavailable." : "No reaction data yet."}</p>}
          </div>
        </section>

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

      <section className="rounded-2xl border border-border-primary bg-white/[0.03] p-5">
        <h2 className="font-semibold text-ink-primary">Lighthouse health</h2>
        <p className="mt-1 text-xs text-ink-secondary">Hourly mobile and desktop PageSpeed results when the production URL is reachable.</p>
        {scoresUnavailable && !lighthouse.partialFailure && !lighthouseResult.failed && (
          <p role="status" className="mt-4 rounded-xl border border-border-hairline bg-surface-base px-4 py-3 text-sm text-ink-secondary">
            {process.env.IS_ALLOY === "true" ? "PageSpeed scores are unavailable in the sandbox preview. They are fetched from the production site when deployed." : "PageSpeed scores are not available yet. Check the production URL and PageSpeed API access."}
          </p>
        )}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Mobile</h3>
            <div className="grid gap-2 sm:grid-cols-2"><Score label="Performance" value={lighthouse.mobile?.performance} /><Score label="Accessibility" value={lighthouse.mobile?.accessibility} /><Score label="Best practices" value={lighthouse.mobile?.bestPractices} /><Score label="SEO" value={lighthouse.mobile?.seo} /></div>
          </div>
          <div>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Desktop</h3>
            <div className="grid gap-2 sm:grid-cols-2"><Score label="Performance" value={lighthouse.desktop?.performance} /><Score label="Accessibility" value={lighthouse.desktop?.accessibility} /><Score label="Best practices" value={lighthouse.desktop?.bestPractices} /><Score label="SEO" value={lighthouse.desktop?.seo} /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
