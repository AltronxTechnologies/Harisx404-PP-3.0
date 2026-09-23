import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, BookOpen, Eye, Heart, MessageSquare, MousePointerClick } from "lucide-react";
import { getBuildTimeStats } from "@/app/lib/stats/build-time-stats";
import { getLighthouseStats } from "@/app/lib/stats/lighthouse-stats";
import { getServerStats } from "@/app/lib/stats/server-stats";

export const metadata: Metadata = { title: "Analytics | Admin" };

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Eye }) {
  return <div className="rounded-xl border border-border-hairline bg-surface-raised p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-ink-secondary">{label}</p><Icon className="size-4 text-accent-signal" /></div><p className="mt-3 text-3xl font-bold tracking-tight text-ink-primary">{value}</p></div>;
}

function Score({ label, value }: { label: string; value: number | undefined }) {
  const score = value == null ? null : Math.max(0, Math.min(100, Math.round(value)));
  return <div className="rounded-lg border border-border-hairline bg-surface-base p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-ink-secondary">{label}</span><span className="font-mono text-sm font-semibold text-ink-primary">{score ?? "—"}</span></div>{score != null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-hairline"><div className={`h-full rounded-full ${score >= 90 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} /></div>}</div>;
}

async function attempt<T>(load: () => Promise<T>): Promise<{ data: T | null; failed: boolean }> {
  try {
    return { data: await load(), failed: false };
  } catch {
    return { data: null, failed: true };
  }
}

export default async function AdminAnalyticsPage() {
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
  return <div className="flex flex-col gap-8">
    <div><h1 className="text-2xl font-bold tracking-tight text-ink-primary">Analytics</h1><p className="text-sm text-ink-secondary">Private site activity, content performance, and operational health.</p></div>
    {hasDataFailure && <div role="alert" className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">Some analytics sources are temporarily unavailable. Unknown values are shown as an em dash rather than zero.</div>}
    <section aria-labelledby="analytics-overview"><h2 id="analytics-overview" className="mb-4 text-sm font-semibold text-ink-primary">Overview</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Article views" value={server ? server.totalViews.toLocaleString("en-US") : "—"} icon={Eye} /><Metric label="Reactions" value={server ? server.totalReactions.toLocaleString("en-US") : "—"} icon={Heart} /><Metric label="Published notes" value={server ? server.communityWallMessages : "—"} icon={MessageSquare} /><Metric label="Published articles" value={build ? build.totalArticles : "—"} icon={BookOpen} /></div></section>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm"><header className="border-b border-border-hairline px-5 py-4"><h2 className="font-semibold text-ink-primary">Top viewed articles</h2></header><div className="divide-y divide-border-hairline">{server?.topViewedArticles.length ? server.topViewedArticles.map((article) => <Link key={article.slug} href={`/blog/${article.slug}`} target="_blank" className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-surface-base"><span className="truncate font-medium text-ink-primary">{article.title}</span><span className="shrink-0 font-mono text-xs text-ink-secondary">{article.count.toLocaleString("en-US")} views <ArrowUpRight className="ml-1 inline size-3" /></span></Link>) : <p className="px-5 py-6 text-sm text-ink-secondary">{serverResult.failed ? "Article view analytics are temporarily unavailable." : "No article view data yet."}</p>}</div></section>
      <section className="overflow-hidden rounded-xl border border-border-hairline bg-surface-raised shadow-sm"><header className="border-b border-border-hairline px-5 py-4"><h2 className="font-semibold text-ink-primary">Most reacted articles</h2></header><div className="divide-y divide-border-hairline">{server?.topReactedArticles.length ? server.topReactedArticles.map((article) => <Link key={article.slug} href={`/blog/${article.slug}`} target="_blank" className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-surface-base"><span className="truncate font-medium text-ink-primary">{article.title}</span><span className="shrink-0 font-mono text-xs text-ink-secondary">{article.count.toLocaleString("en-US")} reactions <ArrowUpRight className="ml-1 inline size-3" /></span></Link>) : <p className="px-5 py-6 text-sm text-ink-secondary">{serverResult.failed ? "Reaction analytics are temporarily unavailable." : "No reaction data yet."}</p>}</div></section>
      <section className="rounded-xl border border-border-hairline bg-surface-raised p-5 shadow-sm"><div className="flex items-center gap-2"><MousePointerClick className="size-4 text-accent-signal" /><h2 className="font-semibold text-ink-primary">Reaction breakdown</h2></div>{server ? <div className="mt-5 space-y-4">{Object.entries(reactions).map(([name, value]) => <div key={name}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="capitalize text-ink-secondary">{name}</span><span className="font-mono text-ink-primary">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-border-hairline"><div className="h-full rounded-full bg-accent-signal" style={{ width: `${(value / reactionMax) * 100}%` }} /></div></div>)}</div> : <p className="mt-5 text-sm text-ink-secondary">Reaction analytics are temporarily unavailable.</p>}</section>
      <section className="rounded-xl border border-border-hairline bg-surface-raised p-5 shadow-sm"><div className="flex items-center gap-2"><Activity className="size-4 text-accent-signal" /><h2 className="font-semibold text-ink-primary">Content distribution</h2></div><div className="mt-5 space-y-3">{build?.categoryBreakdown.length ? build.categoryBreakdown.map((category) => <div key={category.name} className="flex items-center justify-between rounded-lg border border-border-hairline bg-surface-base px-3 py-2 text-sm"><span className="text-ink-secondary">{category.name}</span><span className="font-mono text-xs font-semibold text-ink-primary">{category.count}</span></div>) : <p className="text-sm text-ink-secondary">{buildResult.failed ? "Content analytics are temporarily unavailable." : "No category data yet."}</p>}</div></section>
    </div>
    <section className="rounded-xl border border-border-hairline bg-surface-raised p-5 shadow-sm"><h2 className="font-semibold text-ink-primary">Lighthouse health</h2><p className="mt-1 text-xs text-ink-secondary">Hourly mobile and desktop PageSpeed results when the production URL is reachable.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><div><h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Mobile</h3><div className="grid gap-2 sm:grid-cols-2"><Score label="Performance" value={lighthouse.mobile?.performance} /><Score label="Accessibility" value={lighthouse.mobile?.accessibility} /><Score label="Best practices" value={lighthouse.mobile?.bestPractices} /><Score label="SEO" value={lighthouse.mobile?.seo} /></div></div><div><h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-secondary">Desktop</h3><div className="grid gap-2 sm:grid-cols-2"><Score label="Performance" value={lighthouse.desktop?.performance} /><Score label="Accessibility" value={lighthouse.desktop?.accessibility} /><Score label="Best practices" value={lighthouse.desktop?.bestPractices} /><Score label="SEO" value={lighthouse.desktop?.seo} /></div></div></div></section>
  </div>;
}
