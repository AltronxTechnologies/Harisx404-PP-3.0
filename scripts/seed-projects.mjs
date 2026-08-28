import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables. Make sure you run with node --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const projects = [
  {
    title: "IntruShield NIDS",
    slug: "intrushield-nids",
    description:
      "An enterprise-grade Security Operations Center (SOC) platform featuring real-time network intrusion detection, Suricata 7 DPI, and FastAPI.",
    content: "An enterprise-grade Security Operations Center (SOC) platform featuring real-time network intrusion detection, Suricata 7 DPI, and FastAPI.",
    cover_image_url: "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png",
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 0,
  },
  {
    title: "MedicaLink-HMS",
    slug: "medicalink-hms",
    description:
      "An enterprise-grade Hospital Management SaaS built with a MERN stack, AI integration, and real-time WebSockets.",
    content: "An enterprise-grade Hospital Management SaaS built with a MERN stack, AI integration, and real-time WebSockets.",
    cover_image_url: "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png",
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 1,
  },
  {
    title: "PacketVision Network Sniffer",
    slug: "packetvision-network-sniffer",
    description:
      "A high-performance network packet inspection engine using Python and Scapy.",
    content: "A high-performance network packet inspection engine using Python and Scapy.",
    cover_image_url: "https://res.cloudinary.com/i22q5puf/image/upload/v1786526260/portfolio/haris_primary_photo.png",
    github_url: "https://github.com/harisx404",
    status: "published",
    display_order: 2,
  }
];

async function seedProjects() {
  for (const project of projects) {
    const { error } = await supabase
      .from('projects')
      .upsert(project, { onConflict: 'slug' });
      
    if (error) {
      console.error(`Failed to seed ${project.title}:`, error);
    } else {
      console.log(`Successfully seeded ${project.title}`);
    }
  }
}

seedProjects();
