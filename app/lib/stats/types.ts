export type ReactionType = "like" | "heart" | "celebrate" | "insightful";

export interface BuildTimeStats {
  totalArticles: number;
  categoryBreakdown: CategoryCount[];
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface ServerStats {
  totalViews: number;
  totalReactions: number;
  reactionsByType: Record<ReactionType, number>;
  topViewedArticles: ArticleMetric[];
  topReactedArticles: ArticleMetric[];
  communityWallMessages: number;
}

export interface ArticleMetric {
  slug: string;
  title: string;
  count: number;
  imageName?: string;
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fetchedAt: string;
}

export interface LighthouseStats {
  mobile: LighthouseScores | null;
  desktop: LighthouseScores | null;
  partialFailure: boolean;
}
