import type { ReactNode } from "react";

export type LocationType = "On-site" | "Hybrid" | "Remote";

export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Self-employed"
  | "Freelance"
  | "Contract"
  | "Internship"
  | "Apprenticeship"
  | "Seasonal"
  | "Open source";

export interface ResumeHighlight {
  lead: string;
  text: ReactNode;
}

export interface Experience {
  id?: string;
  jobTitle: string;
  organization: string;
  /** Optional square logo shown beside the organization name */
  logoUrl?: string;
  location: string;
  locationType: LocationType | "";
  employmentType: EmploymentType | "";
  /** 1-12; omit when only the year is known */
  startMonth?: number;
  startYear?: number;
  /** 1-12; ignored when current is true */
  endMonth?: number;
  endYear?: number;
  /** "I currently work here" */
  current?: boolean;
  /** Pre-formatted period for legacy rows without structured dates */
  legacyPeriod?: string;
  summary?: ReactNode;
  highlights: ResumeHighlight[];
}

export interface ResumeData {
  experiences: Experience[];
  avatarUrl: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function label(month: number | undefined, year: number): string {
  return month ? `${MONTHS[month - 1]} ${year}` : `${year}`;
}

/** "Jun 2026 — Jul 2026", "Mar 2026", "2024 — Present". */
export function formatPeriod(e: Experience): string {
  if (!e.startYear) return e.legacyPeriod ?? "";
  const start = label(e.startMonth, e.startYear);
  if (e.current) return `${start} — Present`;
  if (!e.endYear) return start;
  const end = label(e.endMonth, e.endYear);
  return start === end ? start : `${start} — ${end}`;
}
