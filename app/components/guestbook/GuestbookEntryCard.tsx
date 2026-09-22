import Image from "next/image";
import { patterns } from "@/app/lib/communityWall/types";
import { ScallopDivider } from "./ScallopDivider";
import { EntryLinkButton } from "./EntryLinkButton";

/** Dark radial gradients per pattern index — reference entry banners. */
const GRADIENTS = [
  "radial-gradient(90% 80% at 30% 20%, rgba(6,78,59,0.9), rgba(5,20,14,0.92))", // emerald
  "radial-gradient(90% 80% at 30% 20%, rgba(180,83,9,0.9), rgba(40,15,5,0.92))", // amber
  "radial-gradient(90% 80% at 30% 20%, rgba(29,78,216,0.9), rgba(10,20,50,0.92))", // sapphire
  "radial-gradient(90% 80% at 30% 20%, rgba(190,18,60,0.9), rgba(40,8,15,0.92))", // crimson
  "radial-gradient(90% 80% at 30% 20%, rgba(14,74,94,0.9), rgba(8,25,35,0.95))", // teal
];

const ROTATIONS = ["rotate-1 hover:rotate-2", "-rotate-1 hover:-rotate-2", "rotate-2 hover:rotate-[3deg]", "-rotate-2 hover:-rotate-[3deg]"];

interface GuestbookEntryCardProps {
  id: string;
  message: string;
  patternIndex: number;
  author: string;
  avatarUrl?: string | null;
  createdAt: string;
  order: number;
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
  order,
}: GuestbookEntryCardProps) {
  const safeIndex = Math.abs(patternIndex) % GRADIENTS.length;
  const doodle = patterns[safeIndex % patterns.length]?.svg;

  return (
    <article
      id={`entry-${id}`}
      aria-labelledby={`entry-${id}-title`}
      className={`group relative flex scroll-mt-40 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-300 target:ring-2 target:ring-white/40 target:ring-offset-2 target:ring-offset-transparent hover:z-10 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:transform-none dark:bg-neutral-900 ${ROTATIONS[order % ROTATIONS.length]}`}
    >
      {/* Inner highlight border (dark mode) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      />

      {/* Message banner */}
      <div
        className="relative flex min-h-44 w-full items-center justify-center overflow-hidden p-6 pb-10 text-center"
        style={{ background: GRADIENTS[safeIndex] }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-50 mix-blend-color-dodge">
          {doodle}
        </div>
        <h3 id={`entry-${id}-title`} className="relative z-10 line-clamp-6 text-balance text-lg font-bold leading-snug text-neutral-100">
          {message}
        </h3>
        <ScallopDivider />
      </div>

      {/* Meta bar */}
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
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
            <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">{author}</p>
            <time dateTime={createdAt} className="block font-mono text-[10px] text-text-secondary">
              {formatEntryDate(createdAt)}
            </time>
          </div>
        </div>
        <EntryLinkButton entryId={id} />
      </div>
    </article>
  );
}
