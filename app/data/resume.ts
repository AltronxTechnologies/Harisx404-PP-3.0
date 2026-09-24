export const RESUME_PDF = "/muhammad-haris-resume.pdf";
export const RESUME_DOWNLOAD_NAME = "Muhammad-Haris-Resume.pdf";
export const RESUME_REVISION = "September 2026";

export type ResumeEntry = {
  title: string;
  organization: string;
  period: string;
  bullets?: string[];
  description?: string;
};

export const resumeExperience: ResumeEntry[] = [
  {
    title: "Cybersecurity Intern",
    organization: "CodeAlpha · Remote",
    period: "Jun 2026 – Jul 2026",
    bullets: [
      "Configured a Network Intrusion Detection System with Snort and Suricata, including traffic monitoring, alert rules, and intrusion-response workflows.",
      "Built a Python network sniffer with Scapy and sockets to capture packets, analyze payload structures, and map data flows.",
      "Performed manual code reviews and static analysis to identify application vulnerabilities and document remediation steps.",
      "Designed security-awareness training modules focused on social engineering and phishing prevention.",
    ],
  },
  {
    title: "SOC Analyst Intern",
    organization: "Tech Hierarchy · Remote",
    period: "Mar 2026 – Apr 2026",
    bullets: [
      "Used Wazuh SIEM to aggregate endpoint logs, monitor security events, and correlate anomalies across managed infrastructure.",
      "Designed network segmentation in Cisco Packet Tracer, applying subnetting and isolation to restrict lateral movement.",
      "Completed SOC simulations covering traffic analysis, incident triage, endpoint monitoring, and response documentation.",
    ],
  },
];

export const resumeProjects: ResumeEntry[] = [
  {
    title: "IntruShield NIDS",
    organization: "Suricata 7 · FastAPI · WebSockets · Next.js · GeoIP",
    period: "Jul 2026 – Present",
    bullets: [
      "Built an autonomous NIDS and real-time SOC command center with Layer 7 deep-packet inspection and enriched threat alerts.",
      "Developed an async FastAPI backend that enriches alerts with GeoIP intelligence and streams them over WebSockets.",
      "Delivered attack timelines, threat maps, severity filters, and a hot-reload Suricata rule editor.",
    ],
  },
  {
    title: "MedicaLink HMS",
    organization: "TypeScript · MERN · Turborepo · WebSockets",
    period: "Jun 2026 – Present",
    bullets: [
      "Engineered multi-tenant data isolation for hospital organizations and five role-based permission tiers.",
      "Applied Zod validation, secure HTTP-only JWT cookies, Helmet headers, strict CORS, and production API controls.",
    ],
  },
  {
    title: "TourMate Malakand",
    organization: "React · Node.js · Express · MongoDB · Mapbox GL",
    period: "Sep 2025 – Mar 2026",
    bullets: [
      "Implemented OWASP protections for NoSQL injection, XSS, HTTP parameter pollution, and credential handling.",
      "Built a weather API cache that reduced response latency by more than 99%, from 1,150ms to 7ms.",
    ],
  },
];

export const resumeEducation: ResumeEntry[] = [
  {
    title: "B.S. in Information Technology",
    organization: "University of Malakand",
    period: "2022 – 2026",
    description:
      "Graduated with a 3.5/4.0 CGPA. Relevant coursework included a 96% result in Cybersecurity, alongside software engineering, networking, databases, AI, and IoT.",
  },
  {
    title: "KPITB AI/ML Training Program",
    organization: "KPITB · University of Malakand",
    period: "2026",
    description:
      "Completed project-based training in machine learning, deep learning, neural networks, data analysis, model evaluation, and generative AI.",
  },
  {
    title: "Top 15% Nationwide — National Skill Competency Test",
    organization: "HEC · MoITT · P@SHA · PSEB",
    period: "Apr 2026",
    description:
      "Placed in the 84.6th percentile among more than 33,000 computing graduates across ten technical domains.",
  },
];

export const resumeSkills = [
  ["Security operations", "Wazuh SIEM, log analysis, endpoint monitoring, threat detection, network segmentation, and alert triage"],
  ["Application security", "OWASP Top 10, NoSQL injection prevention, XSS mitigation, rate limiting, Helmet, and CORS"],
  ["Auth & access", "HTTP-only JWT cookies, bcrypt password hashing, role-based access control, and Zod validation"],
  ["Network defense", "TCP/IP, DNS, DHCP, subnetting, routing, OSI model, Cisco Packet Tracer, and TLS hardening"],
  ["Web engineering", "Next.js, React, TypeScript, Node.js, Express, MongoDB, PostgreSQL, REST APIs, and WebSockets"],
  ["AI / ML", "Python, scikit-learn, Pandas, NumPy, TensorFlow, PyTorch, neural networks, and generative AI"],
  ["Infrastructure", "Git, GitHub, Linux, Docker, Vercel, Cloudinary, Supabase, and Turborepo"],
] as const;
