"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BentoCard } from "./BentoCard";
import { CredentialBentoPreview } from "./credentials/CredentialBentoPreview";
import type { CredentialSummary } from "@/app/credentials/summary";

export function CredentialBento({
  summary,
  height = "h-[220px]",
}: {
  summary: CredentialSummary;
  height?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div>
      <BentoCard height={height} className="group" linkTo="/credentials">
        <div className="relative z-20 text-center">
          <motion.h3 className="text-base font-medium text-text-primary" initial={reduced ? false : { opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            Credentials
          </motion.h3>
          <motion.p className="mt-1 text-sm text-text-secondary md:text-base" initial={reduced ? false : { opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            Certificates, badges, and achievements.
          </motion.p>
        </div>
        <div className="relative z-20 mt-4 flex flex-1 items-center">
          <CredentialBentoPreview summary={summary} />
        </div>
      </BentoCard>
    </div>
  );
}
