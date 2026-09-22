import { patterns } from "@/app/lib/communityWall/types";
import { ScallopDivider } from "./ScallopDivider";
import { EntryLinkButton } from "./EntryLinkButton";
import { CommunityWallAvatar } from "./CommunityWallAvatar";

/** Dark radial gradients per pattern index — reference entry banners. */
const GRADIENTS = [
  "radial-gradient(90% 80% at 30% 20%, rgba(6,78,59,0.9), rgba(5,20,14,0.92))", // emerald
  "radial-gradient(90% 80% at 30% 20%, rgba(180,83,9,0.9), rgba(40,15,5,0.92))", // amber
  "radial-gradient(90% 80% at 30% 20%, rgba(29,78,216,0.9), rgba(10,20,50,0.92))", // sapphire
  "radial-gradient(90% 80% at 30% 20%, rgba(190,18,60,0.9), rgba(40,8,15,0.92))", // crimson
  "radial-gradient(90% 80% at 30% 20%, rgba(14,74,94,0.9), rgba(8,25,35,0.95))", // teal
  "radial-gradient(90% 80% at 30% 20%, rgba(67,56,202,0.9), rgba(20,18,60,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(126,34,206,0.88), rgba(35,10,55,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(21,94,117,0.92), rgba(5,28,38,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(194,65,12,0.9), rgba(50,18,5,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(22,101,52,0.92), rgba(5,32,17,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(159,18,57,0.9), rgba(48,6,22,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(3,105,161,0.9), rgba(4,31,52,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(124,58,237,0.88), rgba(31,18,63,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(77,124,15,0.9), rgba(20,38,5,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(190,24,93,0.88), rgba(52,7,29,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(30,64,175,0.92), rgba(8,20,60,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(15,118,110,0.9), rgba(4,38,35,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(146,64,14,0.92), rgba(45,20,4,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(109,40,217,0.9), rgba(34,12,66,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(4,120,87,0.9), rgba(3,38,29,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(185,28,28,0.9), rgba(55,7,7,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(29,78,216,0.88), rgba(7,25,69,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(112,26,117,0.9), rgba(36,8,40,0.96))",
  "radial-gradient(90% 80% at 30% 20%, rgba(51,65,85,0.94), rgba(15,23,42,0.98))",
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
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25 mix-blend-color-dodge dark:opacity-20 [&>svg]:scale-75">
          {doodle}
        </div>
        <h3 id={`entry-${id}-title`} className="relative z-10 line-clamp-6 max-w-[28ch] text-balance text-lg font-bold leading-snug tracking-[-0.01em] text-neutral-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.28)]">
          {message}
        </h3>
        <ScallopDivider />
      </div>

      {/* Meta bar */}
      <div className="relative z-10 -mt-px flex items-center justify-between gap-3 bg-white px-4 pb-3 pt-1 dark:bg-neutral-900">
        <div className="flex min-w-0 items-center gap-2.5">
          <CommunityWallAvatar src={avatarUrl} name={author} identity={id} />
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
