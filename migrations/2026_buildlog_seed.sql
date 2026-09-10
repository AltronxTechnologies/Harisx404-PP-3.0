BEGIN;

INSERT INTO public.buildlog_projects (
  name, tagline, info, current_version, items, display_order, status, is_demo
)
SELECT seed.*
FROM (VALUES
  (
    'This Website',
    'Portfolio & blog.',
    'Next.js 15 portfolio with Supabase, MDX articles, live stats, and an admin dashboard.',
    'v2.1',
    '[
      {"title":"Blog details reading experience","description":"Floating TOC pill with progress ring, themed code blocks, image lightbox, share menu.","badge":"v2.1","done":true,"display_order":0},
      {"title":"Community wall (guestbook)","description":"GitHub sign-in, sticky-note cards with doodles, wavy perforations, copy-link anchors.","badge":"v2.1","done":true,"display_order":1},
      {"title":"Live stats page","description":"Article views, reactions, GitHub contribution graph, and site metrics from Supabase.","badge":"v2.0","done":true,"display_order":2},
      {"title":"Admin dashboard","description":"Manage blogs, projects, certifications, and testimonials with a Tiptap editor.","badge":"v2.0","done":true,"display_order":3},
      {"title":"Buildlog redesign","description":"Per-project release notes with shipped and planned work.","badge":"v2.1","done":true,"display_order":4},
      {"title":"AI article assistant","description":"Gemini-powered drafting and summaries inside the admin editor.","badge":"planned","done":false,"display_order":5},
      {"title":"Audio articles","description":"Listen to write-ups with generated narration and a mini player.","badge":"planned","done":false,"display_order":6}
    ]'::jsonb,
    10,
    'published',
    FALSE
  ),
  (
    'IntruShield NIDS',
    'Smart. Secure. Scalable.',
    'SOC platform for network intrusion detection built with Suricata 7 and FastAPI.',
    'v1.2',
    '[
      {"title":"Suricata 7 deep-packet inspection","description":"Live alerts streaming to the SOC dashboard over WebSockets.","badge":"v1.0","done":true,"display_order":0},
      {"title":"Rule management & alert triage","description":"FastAPI backend with role-based analyst access and triage workflows.","badge":"v1.1","done":true,"display_order":1},
      {"title":"Threat timeline & severity analytics","description":"PostgreSQL-backed filtering and severity analytics for alert review.","badge":"v1.2","done":true,"display_order":2},
      {"title":"ML-based anomaly scoring","description":"Score flows with a trained model to cut alert fatigue.","badge":"planned","done":false,"display_order":3},
      {"title":"Multi-sensor fleet management","description":"Deploy and monitor sensors across networks from one console.","badge":"planned","done":false,"display_order":4}
    ]'::jsonb,
    20,
    'published',
    FALSE
  ),
  (
    'MedicaLink-HMS',
    'Care, connected.',
    'Hospital management SaaS on the MERN stack with AI assistance and real-time updates.',
    'v1.1',
    '[
      {"title":"Multi-role portals","description":"Admin, doctor, and patient portals with appointment scheduling.","badge":"v1.0","done":true,"display_order":0},
      {"title":"Live status over WebSockets","description":"Appointments and queues update in real time across portals.","badge":"v1.0","done":true,"display_order":1},
      {"title":"Gemini clinical assistant","description":"Drafts clinical summaries and answers records queries in context.","badge":"v1.1","done":true,"display_order":2},
      {"title":"Pharmacy & inventory module","description":"Stock tracking with reorder alerts and dispensing history.","badge":"planned","done":false,"display_order":3},
      {"title":"Insurance claims workflow","description":"Submit, track, and reconcile claims from the admin portal.","badge":"planned","done":false,"display_order":4}
    ]'::jsonb,
    30,
    'published',
    FALSE
  ),
  (
    'PacketVision',
    'See every packet.',
    'High-performance network packet inspection engine using Python and Scapy.',
    'v1.0',
    '[
      {"title":"Live capture & protocol decoding","description":"Scapy engine with per-protocol filters.","badge":"v1.0","done":true,"display_order":0},
      {"title":"Wireshark-compatible PCAP export","description":"One-click export for deeper offline analysis.","badge":"v1.0","done":true,"display_order":1},
      {"title":"Real-time traffic graphs","description":"Tkinter UI with conversation tracking.","badge":"v1.0","done":true,"display_order":2},
      {"title":"Web dashboard","description":"Move the UI to the browser with a FastAPI backend.","badge":"planned","done":false,"display_order":3}
    ]'::jsonb,
    40,
    'published',
    FALSE
  )
) AS seed(name, tagline, info, current_version, items, display_order, status, is_demo)
ON CONFLICT DO NOTHING;

COMMIT;
