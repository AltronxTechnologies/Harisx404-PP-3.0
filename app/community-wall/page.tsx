import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GridWrapper } from "@/app/components/GridWrapper";
import { PaperHeroTexture } from "@/app/components/PaperHeroTexture";
import { GuestbookActionCard } from "@/app/components/guestbook/GuestbookActionCard";
import { GuestbookEntryCard } from "@/app/components/guestbook/GuestbookEntryCard";
import { CtaSection } from "@/app/components/home/CtaSection";
import { siteMetadata } from "@/app/data/siteMetadata";
import { getSupabaseEnv } from "@/app/lib/supabase/safe";
import createSupabaseServerClient, { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { createGuestbookEntry } from "./actions";
import {
  COMMUNITY_WALL_PAGE_SIZE,
  fetchCommunityWall,
  fetchCommunityWallSettings,
  safeCommunityAvatar,
} from "./data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchCommunityWallSettings();
  const image = `${siteMetadata.siteUrl}/brand/logo-wide.png`;
  return {
    title: settings.seo_title,
    description: settings.seo_description,
    openGraph: {
      title: settings.seo_title,
      description: settings.seo_description,
      type: "website",
      url: `${siteMetadata.siteUrl}/community-wall`,
      images: [{ url: image, width: 1200, height: 630, alt: settings.seo_title }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo_title,
      description: settings.seo_description,
      images: [image],
    },
  };
}

export default async function CommunityWallPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; auth?: string }>;
}) {
  const query = await searchParams;
  const pageValue = query.page || "1";
  const requestedPage = /^\d{1,4}$/.test(pageValue) ? Number(pageValue) : 1;
  const [{ messages, count, page }, settings] = await Promise.all([
    fetchCommunityWall(requestedPage),
    fetchCommunityWallSettings(),
  ]);
  if (page !== requestedPage) {
    redirect(page === 1 ? "/community-wall" : `/community-wall?page=${page}`);
  }

  let user: { id: string; name: string; avatarUrl: string | null } | null = null;
  let hasSubmitted = false;
  if (getSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      user = {
        id: data.user.id,
        name: String(data.user.user_metadata?.full_name || data.user.user_metadata?.user_name || data.user.email?.split("@")[0] || "Visitor"),
        avatarUrl: safeCommunityAvatar(data.user.user_metadata?.avatar_url),
      };
      const db = await createSupabaseAdminClient();
      const { count } = await db.from("messages").select("id", { count: "exact", head: true }).eq("user_id", data.user.id);
      hasSubmitted = (count ?? 0) > 0;
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / COMMUNITY_WALL_PAGE_SIZE));

  return (
    <div className="relative mt-[88px] sm:mt-[72px]">
      <GridWrapper>
        <div className="relative px-4 xl:px-0">
          <PaperHeroTexture className="-inset-x-2 bottom-0 top-[-128px] sm:-inset-x-3 sm:top-[-144px] md:top-[-176px] lg:inset-x-0" />
          <header className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
              {settings.kicker}
            </p>
            <h1 className="heading-glow mx-auto mt-4 max-w-2xl text-balance [font-family:var(--font-instrument-serif),serif] text-5xl font-medium leading-none tracking-tight text-text-primary md:text-6xl md:tracking-[-1.5px]">
              {settings.heading}{" "}
              <span className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]">
                {settings.heading_accent}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-6 text-text-secondary">
              {settings.description}
            </p>
          </header>
        </div>
      </GridWrapper>

      <section aria-labelledby="community-wall-heading" className="mx-auto mt-24 w-full max-w-6xl px-2 sm:px-8 lg:px-0">
        <div className="flex min-h-14 items-center justify-between gap-4 py-3">
          <h2 id="community-wall-heading" className="font-mono text-[11px] font-medium uppercase leading-none tracking-wider text-text-secondary sm:text-xs">
            {settings.collection_label}
          </h2>
          <p className="font-mono text-[11px] uppercase leading-none tracking-wider text-text-secondary sm:text-xs">
            <span className="tabular-nums">{String(count).padStart(2, "0")}</span> messages
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {page === 1 && (
            <GuestbookActionCard
              user={user}
              action={createGuestbookEntry}
              authError={query.auth === "error"}
              hasSubmitted={hasSubmitted}
              copy={{
                signInTitle: settings.sign_in_title,
                signInDescription: settings.sign_in_description,
                composerTitle: settings.composer_title,
                composerDescription: settings.composer_description,
              }}
            />
          )}
          {messages.map((message, index) => (
            <GuestbookEntryCard
              key={message.id}
              id={message.id}
              message={message.message}
              patternIndex={message.patternindex}
              author={message.creator_name}
              avatarUrl={message.creator_avatar_url}
              createdAt={message.created_at}
              order={index}
            />
          ))}
          {messages.length === 0 && page === 1 && (
            <div className="flex min-h-[224px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-primary px-6 text-center md:col-span-1 lg:col-span-2">
              <p className="[font-family:var(--font-instrument-serif),serif] text-2xl font-medium text-text-primary">{settings.empty_title}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{settings.empty_description}</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Community Wall pages" className="mt-6 flex items-center justify-center gap-3">
            {page > 1 && <Link href={page === 2 ? "/community-wall" : `/community-wall?page=${page - 1}`} className="inline-flex min-h-10 items-center rounded-full border border-border-primary px-4 font-mono text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">Previous</Link>}
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Page {page} of {totalPages}</span>
            {page < totalPages && <Link href={`/community-wall?page=${page + 1}`} className="inline-flex min-h-10 items-center rounded-full border border-border-primary px-4 font-mono text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">Next</Link>}
          </nav>
        )}
      </section>

      <div className="mt-28"><CtaSection /></div>
    </div>
  );
}
