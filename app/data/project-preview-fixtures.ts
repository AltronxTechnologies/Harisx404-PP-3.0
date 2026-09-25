// Disposable Alloy-only presentation data. Never write these examples to Supabase.
type PreviewSeed = {
  category: string;
  tagline: string;
  project_stage: "in_progress" | "completed";
  latest_update_label: string;
  content: string;
  case_study_sections: {
    why_built: string;
    key_decisions: string;
    results: string;
    lessons_learned: string;
  };
  live_url?: string;
  github_url?: string;
  source_note?: string;
  gallery: Array<{ photo: string; caption: string }>;
};

const exampleLiveUrl = "https://example.com/";
const exampleRepoUrl = "https://github.com/octocat/Hello-World";
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const projectPreviewFixtures: Record<string, PreviewSeed> = {
  "intrushield-nids": {
    category: "Cybersecurity / Network Defense",
    tagline: "A security-operations workspace for investigating network alerts and understanding what happened on the wire.",
    project_stage: "in_progress",
    latest_update_label: "Q3 2026",
    content: "**Preview overview.** This case study imagines the workflow from packet inspection to an analyst-facing investigation queue. A detection service groups related events; the interface then makes severity, timing, and evidence legible without forcing an analyst to inspect raw logs first. The example is here to evaluate the page layout, not to assert a shipped outcome.",
    case_study_sections: {
      why_built: "Network alerts are useful only when an analyst can understand and act on them. This preview frames the project around shortening the path from a raw event to a triage decision.",
      key_decisions: "- Separate sensor ingestion from the investigation interface.\n- Keep alert history visible alongside the selected event.\n- Surface uncertainty rather than presenting every detection as confirmed.",
      results: "The example result is a readable incident workflow: overview, priority, evidence, and next action stay together. Real detection accuracy and response-time figures would need to be supplied by the owner.",
      lessons_learned: "A useful security dashboard needs a clear evidence trail more than another chart. The preview uses this idea to test long-form text, bullet lists, and gallery rhythm.",
    },
    source_note: "Private security code",
    gallery: [
      { photo: "photo-1526374965328-7f61d4dc18c5", caption: "Security investigation reference" },
      { photo: "photo-1544197150-b99a580bb7a8", caption: "Network infrastructure reference" },
    ],
  },
  "packetvision-network-sniffer": {
    category: "Networking / CLI Tool",
    tagline: "A packet-inspection workflow for capturing traffic, narrowing noisy sessions, and exporting evidence for review.",
    project_stage: "completed",
    latest_update_label: "Q2 2025",
    content: "**Preview overview.** The example follows a capture session from interface selection through protocol filtering and PCAP export. It deliberately presents the command-line workflow instead of suggesting that a hosted dashboard exists.",
    case_study_sections: {
      why_built: "When a network behaves unexpectedly, broad packet captures are hard to inspect. This preview centers a smaller workflow that helps a learner move from capture to a useful filter.",
      key_decisions: "The example keeps capture controls separate from inspection output and treats export as part of the analysis path, not an afterthought. It also leaves room to explain permissions required by local sniffing.",
      results: "The proposed deliverable is a local capture-and-review tool with an exportable artifact. This is sample case-study copy; it does not claim measured throughput or production adoption.",
      lessons_learned: "Packet tooling needs honest boundaries: an interface should make filter scope and capture permissions clear before a user trusts the results.",
    },
    github_url: exampleRepoUrl,
    source_note: "Example GitHub repo",
    gallery: [
      { photo: "photo-1544197150-b99a580bb7a8", caption: "Network equipment reference" },
      { photo: "photo-1518186285589-2f7649de83e0", caption: "Local tooling reference" },
      { photo: "photo-1526374965328-7f61d4dc18c5", caption: "Packet analysis reference" },
    ],
  },
  "medicalink-hms": {
    category: "Health Tech / SaaS",
    tagline: "A hospital-workflow concept connecting appointments, clinical context, and operational handoffs in one place.",
    project_stage: "in_progress",
    latest_update_label: "Q1 2026",
    content: "**Preview overview.** This example case study follows an appointment from booking to handoff. The interface separates patient-facing steps from staff operations and treats clinical information as sensitive throughout the workflow.",
    case_study_sections: {
      why_built: "Disconnected booking and staff workflows can create avoidable repetition. The preview explores a single path for seeing the next action without exposing more patient information than a role needs.",
      key_decisions: "- Separate patient, clinician, and administrator views.\n- Put scheduling changes next to their context.\n- Reserve space for access controls and audit history in the design.",
      results: "The sample outcome is a complete appointment-to-handoff journey. Real clinical deployment, compliance, and patient-impact claims are intentionally not made here.",
      lessons_learned: "In health software, fewer clicks are not enough: the interface must also make role boundaries and the source of each update understandable.",
    },
    live_url: exampleLiveUrl,
    source_note: "Private application repository",
    gallery: [
      { photo: "photo-1538108149393-fbbd81895907", caption: "Care setting reference" },
      { photo: "photo-1551434678-e076c223a692", caption: "Team handoff reference" },
    ],
  },
  "neurodoc-ai-assistant": {
    category: "AI / Knowledge Systems",
    tagline: "A document-questioning concept that pairs cited answers with the passages they came from.",
    project_stage: "in_progress",
    latest_update_label: "Q2 2026",
    content: "**Preview overview.** The page illustrates a retrieval workflow: a document is ingested, relevant passages are found, and an answer is displayed with citations. The example explicitly leaves room for an 'I do not know' state when the source does not support an answer.",
    case_study_sections: {
      why_built: "An answer without a source is difficult to trust. This preview looks at how a reader could verify the passage behind a response without leaving the conversation.",
      key_decisions: "Citations stay adjacent to the answer; unsupported questions return a clear uncertainty state. The preview treats document access and retrieval quality as separate concerns.",
      results: "The example result is a document-to-answer flow with visible source context and a graceful no-answer path, not a claim of model accuracy or clinical suitability.",
      lessons_learned: "Designing for the moment the model is unsure is as important as designing the successful answer state.",
    },
    github_url: exampleRepoUrl,
    source_note: "Example source code",
    gallery: [
      { photo: "photo-1555949963-aa79dcee981c", caption: "AI research reference" },
      { photo: "photo-1518186285589-2f7649de83e0", caption: "Document pipeline reference" },
    ],
  },
  "visionforge-ml-studio": {
    category: "AI / Computer Vision",
    tagline: "An experiment-workspace concept for comparing image models, reviewing predictions, and spotting failure cases.",
    project_stage: "completed",
    latest_update_label: "Q4 2025",
    content: "**Preview overview.** This example organizes a vision experiment around inputs, model versions, and reviewable predictions. It presents the workspace as a way to inspect examples rather than claiming that a single score tells the whole story.",
    case_study_sections: {
      why_built: "Model evaluation gets harder when a metric hides which images were misclassified. The preview gives those examples a first-class place in the workflow.",
      key_decisions: "Prediction comparisons share a consistent image frame, while model version and confidence remain visible. The layout also makes it possible to inspect outliers without losing the broader run context.",
      results: "The illustrated outcome is a review path for comparing runs and collecting failure cases. Benchmarks would require real training and evaluation data from the owner.",
      lessons_learned: "A useful ML interface should make mistakes inspectable, not merely make successful predictions attractive.",
    },
    live_url: exampleLiveUrl,
    source_note: "Experiment code not published",
    gallery: [
      { photo: "photo-1526628953301-3e589a6a8b74", caption: "Model evaluation reference" },
      { photo: "photo-1551288049-bebda4e38f71", caption: "Experiment comparison reference" },
      { photo: "photo-1518186285589-2f7649de83e0", caption: "Training workflow reference" },
    ],
  },
  "taskflow-workspace": {
    category: "Productivity / Collaboration",
    tagline: "A team-workspace concept built around clear ownership, live updates, and a calm view of work in progress.",
    project_stage: "completed",
    latest_update_label: "Q1 2026",
    content: "**Preview overview.** The example covers a task from creation through assignment and review. A board view shows the current state, while the task detail keeps comments, ownership, and activity together.",
    case_study_sections: {
      why_built: "Teams need a shared picture of what is blocked and who can move it forward. This preview focuses on that moment rather than on adding more dashboard widgets.",
      key_decisions: "The board stays scannable at a glance; detailed history lives inside each task. Updates from collaborators are visible without changing the reader's current focus.",
      results: "The sample deliverable is a complete task lifecycle with explicit ownership and a readable activity trail. No usage or delivery-time metrics are implied.",
      lessons_learned: "Collaboration UI works best when it reduces ambiguity about the next action and makes changes easy to trace.",
    },
    live_url: exampleLiveUrl,
    github_url: exampleRepoUrl,
    source_note: "Example project repo",
    gallery: [
      { photo: "photo-1531403009284-440f080d1e12", caption: "Planning workflow reference" },
      { photo: "photo-1551434678-e076c223a692", caption: "Team collaboration reference" },
    ],
  },
  "demo-shopstream-commerce": {
    category: "E-commerce / Web",
    tagline: "A commerce-storefront concept joining product discovery, stock visibility, and checkout in a focused journey.",
    project_stage: "completed",
    latest_update_label: "Q4 2024",
    content: "**Preview overview.** The example follows a shopper from search through product detail and checkout. The editorial rhythm below is meant to test a fuller case study than the existing project summary, not to verify conversion or payment performance.",
    case_study_sections: {
      why_built: "A storefront has to make discovery and availability feel dependable before a shopper reaches payment. This preview connects those moments into one narrative.",
      key_decisions: "Search refinements stay visible while browsing; stock messaging appears where a buying decision happens. Checkout is presented as a continuation of the product journey.",
      results: "The example outcome is an end-to-end storefront flow from search to order confirmation. Real sales and speed figures should replace preview copy only if verified.",
      lessons_learned: "Product discovery, stock, and checkout cannot be polished independently; users experience them as one sequence.",
    },
    live_url: exampleLiveUrl,
    source_note: "Commerce code is private",
    gallery: [
      { photo: "photo-1563013544-824ae1b704d3", caption: "Checkout trust reference" },
      { photo: "photo-1551288049-bebda4e38f71", caption: "Merchant reporting reference" },
    ],
  },
  "demo-sentimentscope-nlp": {
    category: "AI / Language Processing",
    tagline: "An NLP-service concept for reviewing support-ticket sentiment and routing uncertain classifications to people.",
    project_stage: "in_progress",
    latest_update_label: "Q3 2024",
    content: "**Preview overview.** The example describes a ticket moving through language detection, classification, and human review. Confidence is displayed as a decision aid rather than treated as a guarantee.",
    case_study_sections: {
      why_built: "A support team needs to identify urgent messages without hiding nuance. The preview makes the low-confidence path as visible as the automatic classification path.",
      key_decisions: "- Keep language and confidence beside the prediction.\n- Send uncertain cases to a review queue.\n- Show category drift over time without claiming a live model benchmark.",
      results: "The proposed output is an API workflow with a clear manual-review handoff. Accuracy, language coverage, and latency figures are deliberately omitted from this preview narrative.",
      lessons_learned: "Human review is not a failure of automation; it is an important state to design and explain.",
    },
    github_url: exampleRepoUrl,
    source_note: "Example NLP repository",
    gallery: [
      { photo: "photo-1518186285589-2f7649de83e0", caption: "Language pipeline reference" },
      { photo: "photo-1555949963-aa79dcee981c", caption: "Model review reference" },
      { photo: "photo-1460925895917-afdab827c52f", caption: "Classification reporting reference" },
    ],
  },
  "demo-vaultaudit-scanner": {
    category: "Cloud Security / Automation",
    tagline: "A cloud-audit workflow concept that turns configuration findings into reviewable remediation steps.",
    project_stage: "completed",
    latest_update_label: "Q2 2024",
    content: "**Preview overview.** The case study imagines a read-only scan, a prioritized findings list, and a remediation review. It distinguishes observing a risky setting from changing infrastructure so the workflow remains accountable.",
    case_study_sections: {
      why_built: "A long list of cloud checks is not useful if teams cannot tell what changed or how to respond. This preview puts context around each finding.",
      key_decisions: "Read-only discovery and remediation are separate steps. A diff against the previous scan helps focus attention, and each suggested fix stays reviewable before anyone applies it.",
      results: "The sample result is a finding-to-playbook path, not a claim of certified compliance or a completed security audit.",
      lessons_learned: "Security automation is easier to trust when the user can trace evidence and inspect the proposed change before execution.",
    },
    source_note: "Private audit tooling",
    gallery: [
      { photo: "photo-1563013544-824ae1b704d3", caption: "Cloud-security reference" },
      { photo: "photo-1526374965328-7f61d4dc18c5", caption: "Finding review reference" },
    ],
  },
  "demo-pulseboard-analytics": {
    category: "Web Analytics / Privacy",
    tagline: "A privacy-conscious analytics concept for understanding traffic without turning every visitor into a profile.",
    project_stage: "in_progress",
    latest_update_label: "Q1 2024",
    content: "**Preview overview.** This example follows an event from a lightweight collection point into an aggregate dashboard. The page explores how to make traffic trends legible while staying careful about what data is collected.",
    case_study_sections: {
      why_built: "Teams often want to know which pages are useful without tracking people unnecessarily. The preview frames analytics around aggregate questions rather than individual identities.",
      key_decisions: "The example presents totals before detail, keeps collection scope explicit, and treats a public stats view as a separate sharing decision.",
      results: "The illustrated outcome is an aggregate dashboard with a clear path to sharing selected metrics. Privacy and regulatory claims require a real implementation review.",
      lessons_learned: "A small analytics footprint needs both restrained data collection and plain-language explanations of what is measured.",
    },
    live_url: exampleLiveUrl,
    github_url: exampleRepoUrl,
    source_note: "Example analytics repo",
    gallery: [
      { photo: "photo-1460925895917-afdab827c52f", caption: "Aggregate reporting reference" },
      { photo: "photo-1551288049-bebda4e38f71", caption: "Dashboard reference" },
      { photo: "photo-1526628953301-3e589a6a8b74", caption: "Traffic-trend reference" },
    ],
  },
};

export function withProjectPreview<T extends { slug: string; title?: string; cover_image_url?: string | null }>(project: T): T & { isPreview?: boolean } {
  if (process.env.NODE_ENV !== "development" || process.env.IS_ALLOY !== "true" || process.env.PROJECT_DETAIL_PREVIEW_SEED === "false") return project;
  const seed = projectPreviewFixtures[project.slug];
  if (!seed) return project;

  const { gallery, ...fields } = seed;
  const galleryDetails = gallery
    .map(({ photo: id, caption }) => ({ src: photo(id), alt: `Preview stock reference for ${project.title}`, caption: `${caption} - preview stock image, not a project screenshot` }))
    .filter((image) => image.src !== project.cover_image_url);

  return {
    ...project,
    ...fields,
    description: seed.tagline,
    live_url: seed.live_url || "",
    github_url: seed.github_url || "",
    galleryDetails,
    gallery: galleryDetails.map((image) => image.src),
    isPreview: true,
  } as T & { isPreview: boolean };
}
