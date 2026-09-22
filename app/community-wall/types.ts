export type CommunityWallMessage = {
  id: string;
  message: string;
  patternindex: number;
  creator_name: string;
  creator_avatar_url: string | null;
  created_at: string;
};

export type CommunityWallMessageAdmin = CommunityWallMessage & {
  user_id: string | null;
  status: "pending" | "published" | "archived";
  moderated_at: string | null;
  updated_at: string;
};

export type CommunityWallSettings = {
  kicker: string;
  heading: string;
  heading_accent: string;
  description: string;
  collection_label: string;
  sign_in_title: string;
  sign_in_description: string;
  composer_title: string;
  composer_description: string;
  empty_title: string;
  empty_description: string;
  seo_title: string;
  seo_description: string;
};
