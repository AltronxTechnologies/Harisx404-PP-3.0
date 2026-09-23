/* Best-effort public GitHub activity for the locked Home/About bento cards.
   GitHub HTML is cached hourly; failures return null so third-party downtime
   never breaks either public page. */

const HANDLE = "harisx404";
const REVALIDATE = { next: { revalidate: 3600 } } as const;
const REQUEST_TIMEOUT_MS = 8000;

export type GitHubLive = {
  repos: number;
  stars: number;
  followers: number;
  contributions: number;
  /** Calendar week columns containing daily GitHub intensity levels 0..4. */
  weeks: number[][];
};

export async function fetchGitHubActivity(): Promise<GitHubLive | null> {
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
    if (!userRes.ok || !contributionRes.ok) return null;

    const user = await userRes.json();
    let stars = 0;
    if (reposRes.ok) {
      const repos = (await reposRes.json()) as { stargazers_count?: number }[];
      stars = repos.reduce((sum, repository) => sum + (repository.stargazers_count ?? 0), 0);
    }

    let weeks: number[][] = [];
    let contributions = 0;
    const html = await contributionRes.text();
    const totalMatch = html.match(/([\d,]+)\s+contributions?/i);
    if (!totalMatch) return null;
    contributions = Number.parseInt(totalMatch[1].replace(/,/g, ""), 10);
    const cellPattern = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"|data-level="(\d)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g;
    const cells: { date: string; level: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = cellPattern.exec(html))) {
      const date = match[1] ?? match[4];
      const level = Number.parseInt(match[2] ?? match[3], 10);
      if (date) cells.push({ date, level });
    }
    if (cells.length === 0) return null;
    cells.sort((left, right) => left.date.localeCompare(right.date));
    let week: number[] = [];
    for (const cell of cells) {
      if (new Date(`${cell.date}T00:00:00Z`).getUTCDay() === 0 && week.length > 0) {
        weeks.push(week);
        week = [];
      }
      week.push(cell.level);
    }
    if (week.length) weeks.push(week);
    weeks = weeks.slice(-53);

    return {
      repos: user.public_repos ?? 0,
      stars,
      followers: user.followers ?? 0,
      contributions,
      weeks,
    };
  } catch {
    return null;
  }
}
