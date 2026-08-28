import { patterns } from "app/lib/communityWall/types";
import Image from "next/image";

type CommunityWallCardProps = {
  patternIndex: number;
  message?: string;
  rotation?: number;
  author?: string;
  profilePicture?: string;
  className?: string;
};

export function CommunityWallCard({
  patternIndex,
  message = "",
  rotation = 0,
  author = "",
  profilePicture = "",
  className = "",
}: CommunityWallCardProps) {
  const pattern = patterns[patternIndex % patterns.length];

  return (
    <div
      className={`flex flex-col items-start justify-between gap-2 rounded-xl border-2 border-[#A5AEB8/12] bg-[#F7F7F8] p-2.5 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className={`h-full w-full rounded-md bg-gradient-to-b ${pattern.gradient} relative flex items-center justify-center text-balance p-4 text-center`}
      >
        {pattern.svg}
        <p className="z-10 line-clamp-6 text-center text-xl font-bold">
          {message}
        </p>
      </div>
      <div className="flex w-full items-center space-x-2">
        {profilePicture ? (
          <Image
            src={profilePicture}
            className="p2 h-8 w-8 flex-shrink-0 rounded-full border-2 border-transparent ring-1 ring-slate-300"
            alt={`${author}'s avatar`}
            width={32}
            height={32}
          />
        ) : (
          // Fallback when no avatar is available (e.g. builder preview
          // before sign-in): initials circle instead of a broken <img>.
          <span
            aria-hidden
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-slate-200 font-mono text-[10px] uppercase text-slate-500 ring-1 ring-slate-300"
          >
            {(author || "?")
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
        <p className="truncate text-text-secondary">{author}</p>
      </div>
    </div>
  );
}
