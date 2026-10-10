import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (file) => readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8");

test("Home kickers stay 12px at every breakpoint", () => {
  assert.match(source("components/home/SectionHeading.tsx"), /font-mono text-xs font-medium uppercase/);
  for (const name of ["HomeBento", "CaseStudies", "Writings", "AboutTeaser", "Testimonials", "MySiteGrid", "HomeFaq", "CtaSection"]) {
    assert.doesNotMatch(source(`components/home/${name}.tsx`), /xl:(?:\[&>p\]:)?text-\[13px\]/);
  }
});

test("tablet testimonials fit two cards and follow their measured width", () => {
  const testimonials = source("components/home/Testimonials.tsx");
  assert.match(testimonials, /md:w-\[calc\(50%-8px\)\]/);
  assert.match(testimonials, /ResizeObserver\(update\)/);
  assert.match(testimonials, /card\.getBoundingClientRect\(\)\.width/);
  assert.match(testimonials, /index \* \(cardWidth \+ GAP\)/);
});

test("connected Home never substitutes demo endorsements and key links have short names", () => {
  assert.match(source("page.tsx"), /items=\{hasConnectedContent \? dbTestimonials : undefined\}/);
  assert.match(source("components/home/Testimonials.tsx"), /itemsProp \?\? fallbackTestimonials/);
  assert.match(source("components/home/Testimonials.tsx"), /No testimonials to show right now/);
  assert.doesNotMatch(source("components/home/Testimonials.tsx"), /aria-live="polite"/);
  assert.match(source("components/BentoCard.tsx"), /aria-label=\{accessibleLabel\}/);
  assert.match(source("components/home/HomeBento.tsx"), /accessibleLabel="Explore my tech stack"/);
  assert.doesNotMatch(source("components/home/HomeHero.tsx"), /aria-live="polite"/);
  assert.doesNotMatch(source("components/home/CaseStudies.tsx"), /Shipped with CI checks/);
});
