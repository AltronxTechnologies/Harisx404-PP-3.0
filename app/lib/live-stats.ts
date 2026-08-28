/* Server-side fetchers for the live homepage bento cards.
   Every fetcher is best-effort: any failure returns null and the UI
   falls back to a static state — the homepage must never break because
   a third-party API is down. Revalidated hourly via Next fetch cache. */

const HANDLE = "harisx404";
const REVALIDATE = { next: { revalidate: 3600 } } as const;

export type GitHubLive = {
  repos: number;
  stars: number;
  followers: number;
  contributions: number;
  /** 53 columns (weeks) × up to 7 cells, values 0–4 (GitHub levels) */
  weeks: number[][];
};

export type ThmLive = {
  rank: number | null;
  points: number | null;
  rooms: number | null;
  badges: number | null;
  streak: number | null;
};

export type CredlyBadge = { name: string; image: string; issuer: string };
export type CredlyLive = { badges: CredlyBadge[]; total: number };

export type HomeBentoLive = {
  github: GitHubLive | null;
  thm: ThmLive | null;
  credly: CredlyLive | null;
};

async function fetchGitHub(): Promise<GitHubLive | null> {
  try {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": HANDLE };
    const [userRes, reposRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/users/${HANDLE}`, { ...REVALIDATE, headers }),
      fetch(`https://api.github.com/users/${HANDLE}/repos?per_page=100&type=owner`, {
        ...REVALIDATE,
        headers,
      }),
      fetch(`https://github.com/users/${HANDLE}/contributions`, REVALIDATE),
    ]);
    if (!userRes.ok) return null;

    const user = await userRes.json();
    let stars = 0;
    if (reposRes.ok) {
      const repos = (await reposRes.json()) as { stargazers_count?: number }[];
      stars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    }

    let weeks: number[][] = [];
    let contributions = 0;
    if (contribRes.ok) {
      const html = await contribRes.text();
      const totalMatch = html.match(/([\d,]+)\s+contributions?/i);
      if (totalMatch) contributions = parseInt(totalMatch[1].replace(/,/g, ""), 10);

      const cellRe = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"|data-level="(\d)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g;
      const cells: { date: string; level: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = cellRe.exec(html))) {
        const date = m[1] ?? m[4];
        const level = parseInt(m[2] ?? m[3], 10);
        if (date) cells.push({ date, level });
      }
      cells.sort((a, b) => a.date.localeCompare(b.date));
      if (cells.length > 0) {
        // Columns are calendar weeks: start a new column every Sunday.
        let col: number[] = [];
        for (const cell of cells) {
          const day = new Date(`${cell.date}T00:00:00Z`).getUTCDay();
          if (day === 0 && col.length > 0) {
            weeks.push(col);
            col = [];
          }
          col.push(cell.level);
        }
        if (col.length > 0) weeks.push(col);
        weeks = weeks.slice(-53);
      }
    }

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

export async function fetchTryHackMe(): Promise<ThmLive | null> {
  const grab = async (url: string) => {
    try {
      const res = await fetch(url, REVALIDATE);
      if (!res.ok) return null;
      return (await res.json()) as any;
    } catch {
      return null;
    }
  };

  const [rankData, roomsData, badgesData, streakData] = await Promise.all([
    grab(`https://tryhackme.com/api/user/rank/${HANDLE}`),
    grab(`https://tryhackme.com/api/no-completed-rooms-public/${HANDLE}`),
    grab(`https://tryhackme.com/api/badges/get/${HANDLE}`),
    grab(`https://tryhackme.com/api/v2/users/streak?username=${HANDLE}`),
  ]);

  const rank =
    typeof rankData?.userRank === "number"
      ? rankData.userRank
      : typeof rankData === "number"
      ? rankData
      : null;
  const rooms =
    typeof roomsData === "number"
      ? roomsData
      : typeof roomsData?.completedRoomsNo === "number"
      ? roomsData.completedRoomsNo
      : null;
  const badges = Array.isArray(badgesData) ? badgesData.length : null;
  const streak =
    typeof streakData?.data?.streak === "number"
      ? streakData.data.streak
      : typeof streakData?.streak === "number"
      ? streakData.streak
      : typeof streakData === "number"
      ? streakData
      : null;

  if (rank === null && rooms === null && badges === null && streak === null)
    return null;
  return { rank, points: null, rooms, badges, streak };
}

async function fetchCredly(): Promise<CredlyLive | null> {
  try {
    const res = await fetch(`https://www.credly.com/users/${HANDLE}/badges.json`, {
      ...REVALIDATE,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const items = Array.isArray(json?.data) ? json.data : [];
    const badges: CredlyBadge[] = items
      .map((item: any) => ({
        name: item?.badge_template?.name ?? "",
        image:
          item?.badge_template?.image_url ?? item?.image_url ?? item?.image ?? "",
        issuer:
          item?.badge_template?.issuer?.summary ??
          item?.issuer?.summary ??
          item?.badge_template?.issuer_name ??
          "",
      }))
      .filter((b: CredlyBadge) => b.name && b.image);
    return badges.length > 0 ? { badges, total: badges.length } : null;
  } catch {
    return null;
  }
}

export async function fetchBentoLive(): Promise<HomeBentoLive> {
  const [github, thm, credly] = await Promise.all([
    fetchGitHub(),
    fetchTryHackMe(),
    fetchCredly(),
  ]);
  return { github, thm, credly };
}
