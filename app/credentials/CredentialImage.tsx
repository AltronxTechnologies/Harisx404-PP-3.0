"use client";

import { useState } from "react";

export function CredentialImage({ src, className }: { src?: string | null; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // Credential media is admin-managed and may come from any issuer CDN.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}
