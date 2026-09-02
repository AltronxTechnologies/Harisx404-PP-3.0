"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";import { Briefcase, ChevronDown, MapPin } from "lucide-react";
import { Experience, formatPeriod, ResumeData } from "../lib/resume/types";
import { Timeline } from "./Timeline";

const projectLink =
  "rounded-sm font-medium text-text-primary underline decoration-border-primary underline-offset-4 transition-colors hover:decoration-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary";

const resumeData: ResumeData = {
  experiences: [
    {
      jobTitle: "Full-Stack Engineer",
      organization: "Freelance",
      location: "Worldwide",
      locationType: "Remote",
      employmentType: "Self-employed",
      startYear: 2024,
      current: true,
      summary:
        "Delivering end-to-end web applications for clients — owning everything from architecture and UI polish to deployment, monitoring, and handover.",
      highlights: [
        {
          lead: "End-to-End Product Delivery:",
          text: "Ship production applications with Next.js, TypeScript, Node.js, and Supabase — designing the data model, building the interface, and running deployment and monitoring as one accountable owner.",
        },
        {
          lead: "Security-First Engineering:",
          text: "Build OWASP protections, JWT + RBAC authentication, and zero-trust defaults into every delivery from day one — hardening is part of the architecture, not an afterthought.",
        },
        {
          lead: "Performance Optimization:",
          text: "Rebuilt a client's query and caching layer, cutting API response times by 99% and turning a multi-second search into an instant one.",
        },
        {
          lead: "Professional Delivery:",
          text: "Clear estimates, honest weekly updates, and documented handovers — so client teams can maintain what I ship long after the engagement ends.",
        },
      ],
    },
    {
      jobTitle:
        "Full-Stack Developer · Security Tools Engineer · AI/ML Engineer",
      organization: "GitHub — Open Source",
      location: "Worldwide",
      locationType: "Remote",
      employmentType: "Open source",
      startYear: 2026,
      current: true,
      summary: (
        <>
          Building and publishing production-grade tools across all three of
          my domains under one handle —{" "}
          <a
            href="https://github.com/harisx404"
            target="_blank"
            rel="noopener noreferrer"
            className={projectLink}
          >
            github.com/harisx404
          </a>
          .
        </>
      ),
      highlights: [
        {
          lead: "Security Tooling:",
          text: (
            <>
              Built{" "}
              <Link href="/projects/intrushield-nids" className={projectLink}>
                IntruShield NIDS
              </Link>
              , an enterprise-grade SOC platform with Suricata 7 deep-packet
              inspection and a live WebSocket dashboard, and{" "}
              <Link
                href="/projects/packetvision-network-sniffer"
                className={projectLink}
              >
                PacketVision
              </Link>
              , a real-time Scapy packet inspection engine with
              Wireshark-compatible PCAP export.
            </>
          ),
        },
        {
          lead: "Full-Stack Platforms:",
          text: (
            <>
              Developed{" "}
              <a
                href="https://github.com/harisx404/MedicaLink-HMS"
                target="_blank"
                rel="noopener noreferrer"
                className={projectLink}
              >
                MedicaLink-HMS
              </a>
              , an enterprise Hospital Management SaaS with AI integration and
              complete data isolation, and{" "}
              <a
                href="https://github.com/harisx404/tourmate_malakand_frontend"
                target="_blank"
                rel="noopener noreferrer"
                className={projectLink}
              >
                TourMate
              </a>
              , a full-stack tourism platform for the Malakand region with a
              Node.js API, security middleware, and an interactive mapping
              frontend.
            </>
          ),
        },
        {
          lead: "Engineering in the Open:",
          text: "Every project ships with documented architecture, security decisions, and setup guides — a public, verifiable record of how I build across web, security, and AI/ML.",
        },
      ],
    },
    {
      jobTitle: "Cyber Security Intern",
      organization: "CodeAlpha",
      location: "Worldwide",
      locationType: "Remote",
      employmentType: "Internship",
      startMonth: 6,
      startYear: 2026,
      endMonth: 7,
      endYear: 2026,
      summary:
        "Selected for an intensive cybersecurity program focused on the practical implementation of threat detection, secure architecture, and risk assessment.",
      highlights: [
        {
          lead: "Network Intrusion Detection:",
          text: "Set up and configured a Network Intrusion Detection System (NIDS) using Snort and Suricata — continuously monitoring traffic, tuning alert rules, and implementing intrusion response mechanisms.",
        },
        {
          lead: "Packet Analysis & Tool Development:",
          text: "Built a custom Python network sniffer with Scapy and raw sockets to capture traffic, analyze payload structures, and map data flows across the network.",
        },
        {
          lead: "Application Security:",
          text: "Performed manual code reviews and ran static analyzers to identify application vulnerabilities, document findings, and recommend precise remediation steps for safer code.",
        },
        {
          lead: "Security Awareness:",
          text: "Designed comprehensive training modules on social engineering tactics — teaching users to recognize phishing attacks and apply preventative best practices.",
        },
      ],
    },
    {
      jobTitle: "SOC Analyst Intern",
      organization: "Tech Hierarchy",
      location: "Worldwide",
      locationType: "Remote",
      employmentType: "Internship",
      startMonth: 3,
      startYear: 2026,
      endMonth: 3,
      endYear: 2026,
      summary:
        "Hands-on SOC operations and defensive cybersecurity training, specializing in threat monitoring, network infrastructure, and security telemetry.",
      highlights: [
        {
          lead: "SIEM & Log Analysis:",
          text: "Used Wazuh SIEM to aggregate logs, monitor endpoints, and correlate security events — identifying potential network anomalies in production-style telemetry.",
        },
        {
          lead: "Network Segmentation:",
          text: "Designed and simulated virtual network separation in Cisco Packet Tracer, applying strict subnetting and isolation principles to secure data flows.",
        },
        {
          lead: "Defensive Operations:",
          text: "Simulated real-world SOC environments in TryHackMe labs — gaining practical experience in network traffic analysis and incident response procedures.",
        },
        {
          lead: "Threat Mitigation:",
          text: "Strengthened foundational security skills in vulnerability identification, endpoint protection, and active defense strategies.",
        },
      ],
    },
  ],
  avatarUrl: "/harisx404.png",
};

const MD_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Renders DB strings, turning [label](url) into styled links. */
function renderRich(text: ReactNode): ReactNode {
  if (typeof text !== "string" || !MD_LINK.test(text)) return text;
  MD_LINK.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = MD_LINK.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [, label, url] = match;
    nodes.push(
      url.startsWith("/") ? (
        <Link key={key++} href={url} className={projectLink}>
          {label}
        </Link>
      ) : (
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={projectLink}
        >
          {label}
        </a>
      ),
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Collapsible highlight bullets — collapsed by default so the timeline stays
 *  scannable. Handles any number of bullets, animates open/close smoothly,
 *  and is keyboard- and screen-reader-accessible. */
function Highlights({
  highlights,
}: {
  highlights: Experience["highlights"];
}) {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const count = highlights.length;
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center gap-2 rounded-full border border-border-primary px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary dark:border-white/20 dark:hover:border-white/40"
      >
        <span aria-hidden className="text-text-secondary">
          ✦
        </span>
        {open ? "Hide highlights" : `Show highlights (${count})`}
        <ChevronDown
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {/* Bullets stay mounted in the HTML even when collapsed — search
          engines and find-in-page still see every keyword; only the visual
          height animates. */}
      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.25, ease: "easeOut" }
        }
        className="overflow-hidden"
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
      >
        <ul className="mt-4 space-y-4">
          {highlights.map((highlight, i) => (
            <li
              key={i}
              className="flex text-base leading-6 text-text-secondary"
            >
              <span
                aria-hidden
                className="mr-2 shrink-0 font-mono text-text-secondary"
              >
                ✦
              </span>
              <p className="min-w-0 break-words">
                {highlight.lead ? (
                  <>
                    <strong className="font-medium text-text-primary">
                      {highlight.lead}
                    </strong>{" "}
                  </>
                ) : null}
                {renderRich(highlight.text)}
              </p>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

export function Resume({ experiences }: { experiences?: Experience[] }) {
  const prefersReducedMotion = useReducedMotion();
  const entries =
    experiences && experiences.length > 0
      ? experiences
      : resumeData.experiences;
  return (
    <div className="relative -mx-2 sm:-mx-3 lg:mx-0">
      <div className="divide-y divide-gray-200 border-y border-gray-300 dark:divide-white/10 dark:border-white/20">
        {entries.map((experience) => {
              const period = formatPeriod(experience);
              // "Full-time · Remote" line, deduped when the two match.
              const typeMeta = Array.from(
                new Set(
                  [experience.employmentType, experience.locationType]
                    .filter(Boolean)
                    .map((part) => part!.trim()),
                ),
              ).join(" · ");
              // Only render the logo box when a logo is actually set; with no
              // logo the organization name stands alone, flush left.
              const logoCard = experience.logoUrl ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border-primary bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-bg-primary dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={experience.logoUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="h-full w-full object-cover object-center"
                  />
                </span>
              ) : null;
              return (
            <motion.div
              key={experience.id ?? `${experience.organization}-${experience.jobTitle}`}
              className="py-12"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="mx-auto max-w-6xl px-4 xl:px-0">
                <div className="relative grid grid-cols-[1fr,5fr] gap-6 md:grid-cols-[minmax(0,2fr),96px,minmax(0,4fr)] xl:grid-cols-[280px,96px,minmax(0,1fr)]">
                  {/* Node on the timeline where this entry begins (its divider).
                      Positioned inside the grid so its % basis is the exact
                      content box the line overlay uses — aligned at every width. */}
                  <span
                    aria-hidden
                    className="absolute left-4 top-[-48px] z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-bg-primary bg-gray-400 dark:bg-white/50 md:left-[calc(33.333%+24px)] xl:left-[352px]"
                  />
                  <div className="hidden md:block">
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
                      {period}
                    </p>
                    <div className="mt-5 flex items-center gap-3.5">
                      {logoCard}
                      <h3 className="break-words font-display text-2xl font-semibold leading-tight tracking-tight text-text-primary">
                        {experience.organization}
                      </h3>
                    </div>
                    <div className="mt-5 space-y-2">
                      {experience.location ? (
                        <p className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                          <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                          {experience.location}
                        </p>
                      ) : null}
                      {typeMeta ? (
                        <p className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                          <Briefcase aria-hidden className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                          {typeMeta}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div />

                  <div>
                    <div className="mb-4 md:hidden">
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
                        {period}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        {logoCard}
                        <h3 className="break-words font-display text-2xl font-semibold leading-tight tracking-tight text-text-primary">
                          {experience.organization}
                        </h3>
                      </div>
                      <div className="mt-4 space-y-2">
                        {experience.location ? (
                          <p className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                            {experience.location}
                          </p>
                        ) : null}
                        {typeMeta ? (
                          <p className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            <Briefcase aria-hidden className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                            {typeMeta}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <h4 className="break-words font-display text-2xl font-semibold leading-tight tracking-tight text-text-primary">
                      {experience.jobTitle}
                    </h4>
                    {experience.summary ? (
                      <p className="mt-4 break-words text-base leading-relaxed text-text-secondary">
                        {renderRich(experience.summary)}
                      </p>
                    ) : null}
                    {experience.highlights.length > 0 ? (
                      <Highlights highlights={experience.highlights} />
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="mx-auto h-full max-w-6xl px-4 xl:px-0">
          {/* Inner relative box = the grid's content box, so the percentage
              offset is exact at every width (with or without the px-4). */}
          <div className="relative h-full">
            <div className="absolute top-0 h-full w-8 md:left-[calc(33.333%+8px)] xl:left-[336px]">
              <Timeline avatarUrl={resumeData.avatarUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
