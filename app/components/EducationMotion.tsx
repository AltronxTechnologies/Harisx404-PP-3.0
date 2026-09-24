"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

/** Site-standard scroll entrance for the Education panels — the same
 *  fade + 10px rise (once) the Experience entries use. */
export function EduReveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const shouldReduce = mounted && reduced;
  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: shouldReduce ? 0 : 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Gentle desktop hover for the education cards: a small lift with the same
 *  quick, understated ease the rest of the site uses. Only active on devices
 *  with a real hover pointer (mouse/trackpad) — on touch screens the cards
 *  stay perfectly still, so taps never leave them "stuck" mid-hover. */
export function EduCardHover({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const [canHover, setCanHover] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <motion.div
      className="relative mx-auto w-fit"
      whileHover={(mounted && reduced) || !canHover ? undefined : { y: -6 }}
      transition={{ duration: mounted && reduced ? 0 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
