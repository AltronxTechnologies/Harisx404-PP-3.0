import Image from "next/image";
import { patterns } from "@/app/lib/communityWall/types";
import { ScallopDivider } from "./ScallopDivider";
import { EntryLinkButton } from "./EntryLinkButton";

/** Dark radial gradients per pattern index — reference entry banners. */
const GRADIENTS = [
  "radial-gradient(90% 80% at 30% 20%, rgba(6,78,59,0.9), rgba(5,20,14,0.92))", // emerald
  "radial-gradient(90% 80% at 30% 20%, rgba(30,58,138,0.9), rgba(15,23,42,0.95))", // indigo
  "radial-gradient(90% 80% at 30% 20%, rgba(136,19,55,0.9), rgba(40,10,20,0.95))", // amber/rose
  "radial-gradient(90% 80% at 30% 20%, rgba(88,28,135,0.9), rgba(30,10,60,0.95))", // violet
  "radial-gradient(90% 80% at 30% 20%, rgba(14,74,94,0.9), rgba(8,25,35,0.95))", // teal
];

interface GuestbookEntryCardProps {
  id: string;
  message: string;
  patternIndex: number;
  author: string;
  avatarUrl?: string | null;
  createdAt: string;
}

function formatEntryDate(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "2-digit", year: "numeric",
  }).format(value);
}

/** Guestbook sticky-note card — reference treatment: colorful radial banner
 *  with doodle stickers, bold message, wavy perforation, avatar meta bar. */
export function GuestbookEntryCard({
  id,
  message,
  patternIndex,
  author,
  avatarUrl,
  createdAt,
}: GuestbookEntryCardProps) {
  const safeIndex = Math.abs(patternIndex) % GRADIENTS.length;
  const doodle = patterns[safeIndex % patterns.length]?.svg;

  return (
    <article
      id={`entry-${id}`}
      className="group relative flex min-h-[286px] scroll-mt-36 flex-col overflow-hidden rounded-2xl border border-border-primary bg-bg-primary shadow-sm transition-colors target:outline target:outline-2 target:outline-offset-2 target:outline-text-primary hover:border-neutral-400/70 dark:hover:border-white/25"
    >
      {/* Inner highlight border (dark mode) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      />

      {/* Message banner */}
      <div
        className="relative flex min-h-[226px] w-full flex-1 items-center justify-center overflow-hidden p-6 pb-10 text-center"
        style={{ background: GRADIENTS[safeIndex] }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-50 mix-blend-color-dodge">
          {doodle}
        </div>
        <p className="relative z-10 line-clamp-6 text-balance text-lg font-semibold leading-snug text-neutral-100">
          {message}
        </p>
        <ScallopDivider />
      </div>

      {/* Meta bar */}
      <div className="flex min-h-14 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-full ring-1 ring-neutral-300 dark:ring-neutral-600"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-600 ring-1 ring-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-600"
            >
              {author?.charAt(0) || "?"}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200 sm:text-xs">{author}</p>
            <time dateTime={createdAt} className="block font-mono text-xs text-text-secondary sm:text-[10px]">
              {formatEntryDate(createdAt)}
            </time>
          </div>
        </div>
        <EntryLinkButton entryId={id} />
      </div>
    </article>
  );
}
