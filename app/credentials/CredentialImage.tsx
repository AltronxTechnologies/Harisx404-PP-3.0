"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export function CredentialImage({
  src,
  className,
  fallback,
}: {
  src?: string | null;
  className: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    // Credential media is admin-managed and may come from any issuer CDN.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}
