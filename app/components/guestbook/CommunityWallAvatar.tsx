"use client";

import { useState } from "react";
import Image from "next/image";

const profiles = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
  "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-200",
  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-200",
  "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-100",
  "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100",
  "bg-orange-200 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-200",
  "bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  "bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  "bg-green-200 text-green-800 dark:bg-green-950 dark:text-green-200",
  "bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
] as const;

function stableIndex(value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % profiles.length;
}

export function CommunityWallAvatar({
  src,
  name,
  identity,
  className = "size-7",
}: {
  src?: string | null;
  name: string;
  identity: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const variant = stableIndex(identity || name);

  if (src && !failed) {
    return <Image src={src} alt={`${name} profile`} width={40} height={40} onError={() => setFailed(true)} className={`${className} shrink-0 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-600`} />;
  }

  const accentX = 7 + (variant % 3) * 5;
  return <span role="img" aria-label={`${name} default profile`} className={`relative inline-flex ${className} shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10 ${profiles[variant]}`}>
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[82%] fill-current">
      <circle cx="12" cy="8.2" r="4" opacity="0.95" />
      <path d="M4.5 21c.45-5 3.1-7.6 7.5-7.6s7.05 2.6 7.5 7.6H4.5Z" opacity="0.9" />
      <circle cx={accentX} cy="5" r="1.15" fill="currentColor" opacity="0.35" />
    </svg>
  </span>;
}
