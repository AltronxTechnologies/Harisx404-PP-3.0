import { HeroTexture } from "@/app/components/HeroTexture";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { GuestbookActionCard } from "@/app/components/guestbook/GuestbookActionCard";
import { GuestbookEntryCard } from "@/app/components/guestbook/GuestbookEntryCard";
import { CtaSection } from "@/app/components/home/CtaSection";
import { createGuestbookEntry } from "./actions";
import type { Metadata } from "next";

// User-generated content must be fresh on every request — keep this route dynamic.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Wall | Leave Your Mark",
  description:
    "Leave a note on the community wall — messages, doodles, and hellos from visitors of Muhammad Haris's site.",
};

export default async function Page() {
  const supabase = await createSupabaseServerClient();

  const [{ data: messages }, { data: userData }] = await Promise.all([
    supabase.from("messages").select("*").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const user = userData?.user
    ? {
        name:
          userData.user.user_metadata?.full_name ||
          userData.user.email?.split("@")[0] ||
          "Visitor",
        avatarUrl: userData.user.user_metadata?.avatar_url ?? null,
      }
    : null;

  return (
    <div className="relative min-w-0 pb-24">
      {/* Decorative hatched side rails — 12px mobile / 32px desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-3 border-r border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-3 border-l border-border-primary sm:block lg:w-8 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_7px)] dark:[background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_7px)]"
      />

      <HeroTexture />

      {/* Hero — reference: super-title inside h1 + Instrument Serif headline
          with shimmering gradient accent word */}
      <h1 className="relative z-[2] mx-auto mt-24 mb-14 max-w-xl text-balance text-center font-medium text-5xl tracking-tight [text-shadow:rgba(255,255,255,0.05)_0px_4px_8px,rgba(255,255,255,0.2)_0px_8px_30px] max-sm:px-5 md:mt-28 md:text-6xl">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          The wall remembers
        </p>
        <span className="inline-block text-text-primary [font-family:var(--font-instrument-serif),serif]">
          Words That Echo{" "}
          <span
            className="animate-gradient-x text-colorfull px-1 pb-1 italic [text-shadow:none]"
            style={{
              maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
              maskSize: "200% 100%",
              maskPosition: "left center",
              maskRepeat: "no-repeat",
            }}
          >
            Always
          </span>
        </span>
      </h1>

      {/* Guestbook card grid — sign-in/composer card first, then sticky notes */}
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GuestbookActionCard user={user} action={createGuestbookEntry} />
          {(messages ?? []).map((message, index) => (
            <GuestbookEntryCard
              key={message.id}
              id={String(message.id)}
              message={message.message}
              patternIndex={message.patternindex ?? 0}
              author={message.creator_name || "Anonymous"}
              avatarUrl={message.creator_avatar_url}
              createdAt={message.created_at}
              order={index}
            />
          ))}
        </div>
      </div>

      {/* Contact CTA — same shared section as the rest of the site */}
      <div className="relative mt-16">
        <CtaSection />
      </div>
    </div>
  );
}
