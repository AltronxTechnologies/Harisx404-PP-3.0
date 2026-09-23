"use server";

import { unstable_cache } from "next/cache";
import type { LighthouseScores, LighthouseStats } from "./types";

// TODO: Update to your real production domain when you have one
const SITE_URL = "https://harisx404.vercel.app";

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      accessibility?: { score: number };
      "best-practices"?: { score: number };
      seo?: { score: number };
    };
    fetchTime?: string;
  };
}

const requestTimeoutMs = process.env.NODE_ENV === "production" ? 15000 : 3000;

async function fetchLighthouseScores(
  strategy: "mobile" | "desktop"
): Promise<LighthouseScores | null> {
  const apiUrl = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  apiUrl.searchParams.set("url", SITE_URL);
  apiUrl.searchParams.set("strategy", strategy);

  // API expects multiple category params, not comma-separated
  const categories = ["performance", "accessibility", "best-practices", "seo"];
  categories.forEach((cat) => apiUrl.searchParams.append("category", cat));

  // Add API key if available (increases quota from 25/day to 25,000/day)
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) {
    apiUrl.searchParams.set("key", apiKey);
  }

  try {
    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        console.warn(
          `PageSpeed API quota exceeded (${strategy}). Set PAGESPEED_API_KEY for higher limits.`
        );
      } else {
        console.error(`PageSpeed API error (${strategy}):`, response.status, errorText);
      }
      throw new Error(`PageSpeed ${strategy} request failed with ${response.status}.`);
    }

    const data: PageSpeedResponse = await response.json();
    const categories = data.lighthouseResult?.categories;

    if (!categories) {
      console.error(`No categories in PageSpeed response (${strategy})`);
      throw new Error(`PageSpeed ${strategy} response did not include categories.`);
    }
    const scores = [
      categories.performance?.score,
      categories.accessibility?.score,
      categories["best-practices"]?.score,
      categories.seo?.score,
    ];
    if (scores.some((score) => typeof score !== "number")) {
      throw new Error(`PageSpeed ${strategy} response omitted one or more category scores.`);
    }

    return {
      performance: Math.round(categories.performance!.score * 100),
      accessibility: Math.round(categories.accessibility!.score * 100),
      bestPractices: Math.round(categories["best-practices"]!.score * 100),
      seo: Math.round(categories.seo!.score * 100),
      fetchedAt: data.lighthouseResult?.fetchTime ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching Lighthouse scores (${strategy}):`, error);
    throw error;
  }
}

export const getLighthouseStats = unstable_cache(
  async (): Promise<LighthouseStats> => {
    if (process.env.IS_ALLOY === "true") {
      return { mobile: null, desktop: null, partialFailure: false };
    }

    // Fetch both mobile and desktop scores in parallel
    const [mobileResult, desktopResult] = await Promise.allSettled([
      fetchLighthouseScores("mobile"),
      fetchLighthouseScores("desktop"),
    ]);

    return {
      mobile: mobileResult.status === "fulfilled" ? mobileResult.value : null,
      desktop: desktopResult.status === "fulfilled" ? desktopResult.value : null,
      partialFailure: mobileResult.status === "rejected" || desktopResult.status === "rejected",
    };
  },
  ["lighthouse-stats"],
  { revalidate: 3600 }
);
