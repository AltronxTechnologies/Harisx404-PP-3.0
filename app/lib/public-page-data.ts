import "server-only";

import { unstable_cache } from "next/cache";
import {
  fetchExperiences,
  fetchProjects,
  fetchTestimonials,
} from "@/app/lib/utils";

export const fetchCachedProjects = unstable_cache(
  fetchProjects,
  ["public-projects-v1"],
  { revalidate: 60, tags: ["projects"] },
);

export const fetchCachedTestimonials = unstable_cache(
  fetchTestimonials,
  ["public-testimonials-v1"],
  { revalidate: 60, tags: ["testimonials"] },
);

export const fetchCachedExperiences = unstable_cache(
  fetchExperiences,
  ["public-experiences-v1"],
  { revalidate: 3600, tags: ["experiences"] },
);
