import type { Metadata } from "next";
import { GridWrapper } from "@/app/components/GridWrapper";
import { HeroTexture } from "@/app/components/HeroTexture";

export const metadata: Metadata = {
  title: "Resume - Muhammad Haris",
  description:
    "Muhammad Haris's resume — Cybersecurity Professional and Full-Stack Web Developer. Europass-format CV with PDF download.",
};

const RESUME_PDF = "/muhammad-haris-resume.pdf";

/* ─── Europass-style building blocks ────────────────────────────────
   The classic Europass layout: a narrow label column on the left and
   the content on the right, separated by a thin rule, with the
   signature Europass blue for section labels and headings. The sheet
   itself stays white in both themes — like a printed document. */

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-2 border-t border-neutral-200 py-6 sm:grid-cols-[180px_1fr] sm:gap-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1e64c8] sm:pt-1">
        {label}
      </h2>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

function Entry({
  title,
  meta,
  org,
  children,
}: {
  title: string;
  meta: string;
  org?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
          {meta}
        </span>
      </div>
      {org && <p className="mt-0.5 text-[13px] text-[#1e64c8]">{org}</p>}
      {children && (
        <div className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-neutral-700">
          {children}
        </div>
      )}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.slice(0, 32)} className="flex gap-2">
          <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-[#1e64c8]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillRow({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[160px_1fr] sm:gap-4">
      <span className="text-[13px] font-semibold text-neutral-900">{name}</span>
      <span className="text-[13.5px] leading-relaxed text-neutral-700">{detail}</span>
    </div>
  );
}

export default function ResumePage() {
  return (
    <div className="relative">
      <HeroTexture />
      <GridWrapper>
        <div className="mx-auto max-w-4xl px-2 pb-24 pt-20 sm:px-4 md:pt-28">
          {/* Page header */}
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-text-tertiary">
              Resume
            </p>
            <h1 className="mx-auto mt-3 font-display text-4xl leading-[1.05] text-text-primary md:text-6xl">
              The paper <em className="text-gradient-accent italic">version</em>
            </h1>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={RESUME_PDF}
                download="Muhammad-Haris-Resume.pdf"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/85"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 256 256" aria-hidden>
                  <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z" />
                </svg>
                Download resume (PDF)
              </a>
              <a
                href={RESUME_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border-primary px-6 py-3 text-sm font-medium text-text-secondary transition hover:text-text-primary"
              >
                Open in new tab
              </a>
            </div>
          </div>

          {/* ── The Europass sheet — a white printed document in both themes ── */}
          <div className="mt-14 overflow-hidden rounded-2xl border border-border-primary bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]">
            {/* Europass-style masthead */}
            <div className="border-b-4 border-[#1e64c8] px-6 py-6 sm:px-10 sm:py-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1e64c8]">
                    Curriculum Vitae
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                    Muhammad Haris
                  </h2>
                  <p className="mt-1 text-sm font-medium text-neutral-600">
                    Cybersecurity Professional&ensp;|&ensp;Full-Stack Web Developer
                  </p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  Europass format
                </p>
              </div>
            </div>

            <div className="px-6 pb-8 sm:px-10">
              {/* Personal information */}
              <Section label="Personal Information">
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-[13.5px] text-neutral-700 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-neutral-900">Email:</span>{" "}
                    <a className="text-[#1e64c8] hover:underline" href="mailto:itsharis.tech@gmail.com">
                      itsharis.tech@gmail.com
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-900">Location:</span>{" "}
                    Islamabad / Malakand, Pakistan
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-900">LinkedIn:</span>{" "}
                    <a
                      className="text-[#1e64c8] hover:underline"
                      href="https://www.linkedin.com/in/harisx404"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      linkedin.com/in/harisx404
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-900">GitHub:</span>{" "}
                    <a
                      className="text-[#1e64c8] hover:underline"
                      href="https://github.com/harisx404"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/harisx404
                    </a>
                  </p>
                </div>
              </Section>

              {/* Professional summary */}
              <Section label="Professional Summary">
                <p className="text-[13.5px] leading-relaxed text-neutral-700">
                  Information Technology Graduate (BSIT 2022–2026) ranked in the{" "}
                  <strong className="text-neutral-900">Top 15% (84.6th percentile) nationally</strong>{" "}
                  among 33,000+ graduates in the HEC/MoITT National Skill Competency Test. Achieved a{" "}
                  <strong className="text-neutral-900">96% academic benchmark in Cybersecurity</strong>.
                  Experienced in SOC Operations utilizing Wazuh SIEM for threat telemetry, while actively
                  engaged in offensive security labs (TryHackMe, HackTheBox). Uniquely positioned at the
                  intersection of security and engineering, building production-grade MERN architectures
                  with rigorous OWASP Top 10 mitigation strategies — demonstrating application security
                  expertise at the code level, not just in theory.
                </p>
              </Section>

              {/* Work experience */}
              <Section label="Work Experience">
                <Entry
                  title="Cyber Security Intern"
                  org="CodeAlpha · Remote"
                  meta="Jun 2026 – Jul 2026"
                >
                  <Bullets
                    items={[
                      "Configured a Network Intrusion Detection System (NIDS) with Snort/Suricata — traffic monitoring, alert rules, and intrusion response mechanisms.",
                      "Built a custom Python network sniffer (Scapy/socket) to capture packets, analyze payload structures, and map data flows.",
                      "Performed manual code reviews and static analysis to identify application vulnerabilities and document remediation steps.",
                      "Designed security-awareness training modules on social engineering and phishing prevention.",
                    ]}
                  />
                </Entry>
                <Entry
                  title="SOC Analyst Intern"
                  org="Tech Hierarchy · Remote"
                  meta="Mar 2026 – Apr 2026"
                >
                  <Bullets
                    items={[
                      "Utilized Wazuh SIEM to aggregate endpoint logs, monitor security events, and correlate anomalies across managed network infrastructure.",
                      "Designed and simulated network segmentation in Cisco Packet Tracer, applying strict subnetting and isolation to restrict lateral movement.",
                      "Conducted SOC simulation exercises via TryHackMe — network traffic analysis, incident triage, and response documentation.",
                      "Applied endpoint protection methodologies and active defense strategies to strengthen threat identification workflows.",
                    ]}
                  />
                </Entry>
              </Section>

              {/* Flagship projects */}
              <Section label="Flagship Projects">
                <Entry
                  title="IntruShield NIDS"
                  org="Suricata 7 · FastAPI · WebSockets · Next.js · GeoIP"
                  meta="Jul 2026 – Present"
                >
                  <Bullets
                    items={[
                      "Autonomous NIDS and real-time SOC command center performing Layer 7 Deep Packet Inspection with sub-second enriched threat alerts.",
                      "Async FastAPI backend enriches every alert with MaxMind GeoIP2 intelligence and streams over zero-polling WebSockets.",
                      "Interactive dashboard with attack timelines, GeoIP threat maps, severity filters, and a hot-reload Suricata rule editor.",
                    ]}
                  />
                </Entry>
                <Entry
                  title="MedicaLink HMS"
                  org="TypeScript · MERN · Turborepo · WebSockets"
                  meta="Jun 2026 – Present"
                >
                  <Bullets
                    items={[
                      "Engineered multi-tenant schema-level data isolation for strict healthcare compliance across hospital organizations.",
                      "Rigorous RBAC across 5 permission tiers (Admin, Doctor, Nurse, Receptionist, Patient) with Zod validation on all API endpoints.",
                      "Zero-trust production security stack: Helmet headers, strict CORS, and JWT auth via secure HTTP-only cookies.",
                    ]}
                  />
                </Entry>
                <Entry
                  title="TourMate Malakand"
                  org="React.js · Node.js · Express.js · MongoDB · Mapbox GL"
                  meta="Sep 2025 – Mar 2026"
                >
                  <Bullets
                    items={[
                      "Comprehensive OWASP Top 10 mitigation stack — NoSQL injection prevention, XSS sanitization, and HPP normalization.",
                      "bcrypt password hashing and HTTP-only JWTs for zero plaintext credential exposure.",
                      "Custom node-cache proxy for the OpenWeatherMap API, cutting response latency by over 99% (1,150ms → 7ms).",
                    ]}
                  />
                </Entry>
              </Section>

              {/* Education & certifications */}
              <Section label="Education & Training">
                <Entry
                  title="Bachelor of Science, Information Technology"
                  org="University of Malakand"
                  meta="Sep 2022 – Sep 2026"
                >
                  <p>
                    Grade: A+ (96% in Cybersecurity). Focus: Information Security, Computer Networks,
                    AI. Enrolled in the KPITB Blockchain Technology Program.
                  </p>
                </Entry>
                <Entry
                  title="Top 15% Nationwide — National Skill Competency Test"
                  org="HEC · MoITT · P@SHA · PSEB"
                  meta="Apr 2026"
                >
                  <p>
                    84.6th percentile out of 33,000+ computing graduates across 10 core technical
                    domains.
                  </p>
                </Entry>
                <Entry
                  title="Master Computer Networking"
                  org="Scaler Topics"
                  meta="Sep 2025"
                >
                  <p>
                    TCP/IP, DNS, DHCP, OSI Model, Subnetting, Routing protocols, and Network Security
                    architecture.
                  </p>
                </Entry>
                <Entry
                  title="Full-Stack Web Development"
                  org="Apna College (Delta)"
                  meta="2024"
                >
                  <p>
                    Rigorous training in modern frontend and backend development paradigms utilizing
                    the MERN stack.
                  </p>
                </Entry>
              </Section>

              {/* Technical expertise */}
              <Section label="Technical Expertise">
                <div className="space-y-3">
                  <SkillRow
                    name="Security Operations"
                    detail="Wazuh SIEM, Log Analysis, Endpoint Monitoring, Threat Detection, Network Segmentation, Alert Triage"
                  />
                  <SkillRow
                    name="Application Security"
                    detail="OWASP Top 10, NoSQLi Prevention, XSS Mitigation, HTTP Parameter Pollution, Rate Limiting, Helmet, CORS"
                  />
                  <SkillRow
                    name="Auth & Access Control"
                    detail="Stateless JWT (HTTP-only cookies), bcrypt Password Hashing, Role-Based Access Control (RBAC)"
                  />
                  <SkillRow
                    name="Network Defense"
                    detail="TCP/IP, DNS, DHCP, Subnetting, Routing Protocols, OSI Model, Cisco Packet Tracer, SSL/TLS Hardening"
                  />
                  <SkillRow
                    name="Web Architecture"
                    detail="MERN Stack (MongoDB, Express.js, React.js, Node.js), TypeScript, REST APIs, WebSockets, Tailwind CSS"
                  />
                  <SkillRow
                    name="AI / ML"
                    detail="Machine Learning, Deep Learning, Neural Networks, Scikit-learn, Pandas, NumPy, Matplotlib"
                  />
                  <SkillRow
                    name="Infrastructure & Tools"
                    detail="Git, GitHub, Linux, MongoDB Atlas, Vercel, Cloudinary CDN, Turborepo Monorepos"
                  />
                  <SkillRow name="Languages" detail="JavaScript, TypeScript, Python, C++" />
                </div>
              </Section>
            </div>
          </div>

          {/* Bottom download CTA */}
          <div className="mt-10 flex justify-center">
            <a
              href={RESUME_PDF}
              download="Muhammad-Haris-Resume.pdf"
              className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-text-secondary transition-colors hover:text-text-primary"
            >
              Download the PDF
              <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-primary transition-transform duration-300 group-hover:translate-y-0.5">
                ↓
              </span>
            </a>
          </div>
        </div>
      </GridWrapper>
    </div>
  );
}
