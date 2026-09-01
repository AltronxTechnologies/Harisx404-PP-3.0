"use client";

import { motion } from "framer-motion";
import { GridWrapper } from "../GridWrapper";
import { usePerformanceMode } from "@/app/hooks/usePerformanceMode";

export function StatsPageHeader() {
  const { shouldReduceAnimations } = usePerformanceMode();

  // Mobile: Plain divs (zero animation overhead)
  if (shouldReduceAnimations) {
    return (
      <section>
        <GridWrapper>
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary">STATS</span>
          </div>
        </GridWrapper>
        <GridWrapper>
          <h1 className="mx-auto mt-3 max-w-2xl text-balance text-center font-display text-4xl leading-[1.05] text-text-primary md:text-5xl">
            A peek <em className="text-gradient-accent italic">behind the curtain</em>
          </h1>
        </GridWrapper>
        <GridWrapper>
          <p className="mx-auto mt-4 max-w-xl text-center leading-8 text-text-secondary">
            Numbers, metrics, and fun facts about this little corner of the
            internet. Updated in real-time.
          </p>
        </GridWrapper>
      </section>
    );
  }

  // Desktop: Full Framer Motion animations
  return (
    <section>
      <GridWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="font-mono text-xs uppercase tracking-[0.35em] text-text-secondary">STATS</span>
        </motion.div>
      </GridWrapper>
      <GridWrapper>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-3 max-w-2xl text-balance text-center font-display text-4xl leading-[1.05] text-text-primary md:text-5xl"
        >
          A peek <em className="text-gradient-accent italic">behind the curtain</em>
        </motion.h1>
      </GridWrapper>
      <GridWrapper>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-4 max-w-xl text-center leading-8 text-text-secondary"
        >
          Numbers, metrics, and fun facts about this little corner of the
          internet. Updated in real-time.
        </motion.p>
      </GridWrapper>
    </section>
  );
}
