"use client";

import { useState } from "react";
import Image from "next/image";

const fallbacks = [
  ["🌿", "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"],
  ["✨", "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"],
  ["🚀", "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"],
  ["🧠", "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200"],
  ["🛡️", "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"],
  ["💻", "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200"],
  ["🎨", "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200"],
  ["📚", "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"],
  ["⚡", "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"],
  ["🌙", "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"],
  ["☀️", "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"],
  ["🌊", "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"],
  ["🔷", "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200"],
  ["🧩", "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200"],
  ["🎯", "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"],
  ["🌸", "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200"],
  ["🦉", "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100"],
  ["🐼", "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"],
  ["🐯", "bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100"],
  ["🦊", "bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-100"],
  ["🐧", "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100"],
  ["🐙", "bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100"],
  ["🍀", "bg-green-100 text-green-900 dark:bg-green-900/50 dark:text-green-100"],
  ["🔥", "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"],
] as const;

function stableIndex(value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % fallbacks.length;
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
  const [emoji, colors] = fallbacks[stableIndex(identity || name)];

  if (src && !failed) {
    return <Image src={src} alt={`${name} profile`} width={40} height={40} onError={() => setFailed(true)} className={`${className} shrink-0 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-600`} />;
  }

  return <span role="img" aria-label={`${name} avatar`} className={`inline-flex ${className} shrink-0 items-center justify-center rounded-full text-[13px] ring-1 ring-black/5 dark:ring-white/10 ${colors}`}>{emoji}</span>;
}
