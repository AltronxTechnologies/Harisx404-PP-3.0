/* Best-effort public GitHub activity for the Home/About bento cards.
   GitHub HTML is cached hourly; a process-level last-known-good snapshot keeps
   transient third-party failures from replacing valid activity with zeroes. */

import "server-only";
import { unstable_cache } from "next/cache";

const HANDLE = "harisx404";
const REVALIDATE = { next: { revalidate: 3600 } } as const;
const REQUEST_TIMEOUT_MS = 2500;

export type GitHubDay = {
  date: string;
  level: number;
  count: number;
};

export type GitHubLive = {
  repos: number;
  stars: number;
  followers: number;
  contributions: number;
  totalContributions: number;
  /** Calendar week columns containing real daily dates, counts, and levels. */
  weeks: GitHubDay[][];
  freshness: "live" | "cached";
  fetchedAt: string;
};

const githubMemory = globalThis as typeof globalThis & {
  githubLastSuccessfulActivity?: GitHubLive;
};

function cachedOrUnavailable() {
  const cached = githubMemory.githubLastSuccessfulActivity;
  return cached ? { ...cached, freshness: "cached" as const } : null;
}

async function loadGitHubActivity(): Promise<GitHubLive | null> {
  try {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": HANDLE };
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const [userRes, reposRes, contributionRes] = await Promise.all([
      fetch(`https://api.github.com/users/${HANDLE}`, { ...REVALIDATE, headers, signal }),
      fetch(`https://api.github.com/users/${HANDLE}/repos?per_page=100&type=owner`, {
        ...REVALIDATE,
        headers,
        signal,
      }),
      fetch(`https://github.com/users/${HANDLE}/contributions`, { ...REVALIDATE, signal }),
    ]);
    if (!userRes.ok || !contributionRes.ok) return cachedOrUnavailable();

    const user = (await userRes.json()) as {
      public_repos?: number;
      followers?: number;
      created_at?: string;
    };
    let stars = 0;
    if (reposRes.ok) {
      const repos = (await reposRes.json()) as { stargazers_count?: number }[];
      stars = repos.reduce((sum, repository) => sum + (repository.stargazers_count ?? 0), 0);
    }

    let weeks: GitHubDay[][] = [];
    let contributions = 0;
    const html = await contributionRes.text();
    const totalMatch = html.match(/([\d,]+)\s+contributions?/i);
    if (!totalMatch) return cachedOrUnavailable();
    contributions = Number.parseInt(totalMatch[1].replace(/,/g, ""), 10);

    const firstYear = new Date(user.created_at || "").getUTCFullYear();
    const currentYear = new Date().getUTCFullYear();
    if (!Number.isFinite(firstYear) || firstYear > currentYear) return cachedOrUnavailable();
    const years = Array.from(
      { length: currentYear - firstYear + 1 },
      (_, index) => firstYear + index,
    );
    const annualResponses = await Promise.all(
      years.map((year) =>
        fetch(
          `https://github.com/users/${HANDLE}/contributions?from=${year}-01-01&to=${year}-12-31`,
          { ...REVALIDATE, signal },
        ),
      ),
    );
    if (annualResponses.some((response) => !response.ok)) return cachedOrUnavailable();
    const annualHtml = await Promise.all(annualResponses.map((response) => response.text()));
    const annualTotals = annualHtml.map((yearHtml) => {
      const match = yearHtml.match(/([\d,]+)\s+contributions?/i);
      return match ? Number.parseInt(match[1].replace(/,/g, ""), 10) : Number.NaN;
    });
    if (annualTotals.some((total) => !Number.isFinite(total))) return cachedOrUnavailable();
    const totalContributions = annualTotals.reduce((sum, total) => sum + total, 0);
    const cellPattern = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"|data-level="(\d)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g;
    const cells: GitHubDay[] = [];
    let match: RegExpExecArray | null;
    while ((match = cellPattern.exec(html))) {
      const date = match[1] ?? match[4];
      const level = Number.parseInt(match[2] ?? match[3], 10);
      if (date) cells.push({ date, level, count: 0 });
    }
    if (cells.length === 0) return cachedOrUnavailable();
    const tooltipPattern = /<tool-tip\b[^>]*>(?:No contributions|([\d,]+) contributions?) on [^<]+<\/tool-tip>/g;
    const counts: number[] = [];
    while ((match = tooltipPattern.exec(html))) {
      counts.push(match[1] ? Number.parseInt(match[1].replace(/,/g, ""), 10) : 0);
    }
    if (counts.length !== cells.length) return cachedOrUnavailable();
    cells.forEach((cell, index) => {
      cell.count = counts[index];
    });
    cells.sort((left, right) => left.date.localeCompare(right.date));
    let week: GitHubDay[] = [];
    for (const cell of cells) {
      if (new Date(`${cell.date}T00:00:00Z`).getUTCDay() === 0 && week.length > 0) {
        weeks.push(week);
        week = [];
      }
      week.push(cell);
    }
    if (week.length) weeks.push(week);
    weeks = weeks.slice(-53);

    const activity: GitHubLive = {
      repos: user.public_repos ?? 0,
      stars,
      followers: user.followers ?? 0,
      contributions,
      totalContributions,
      weeks,
      freshness: "live",
      fetchedAt: new Date().toISOString(),
    };
    githubMemory.githubLastSuccessfulActivity = activity;
    return activity;
  } catch {
    return cachedOrUnavailable();
  }
}

const getCachedGitHubActivity = unstable_cache(
  loadGitHubActivity,
  ["github-public-activity-v3"],
  { revalidate: 3600, tags: ["github-activity"] },
);

export async function fetchGitHubActivity() {
  const activity = await getCachedGitHubActivity();
  if (activity?.freshness === "live") {
    githubMemory.githubLastSuccessfulActivity = activity;
  }
  return activity;
}
