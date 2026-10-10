# Phase 1: AI Assistant Product Contract & Visual Design Specification

**Document:** `docs/ai-assistant/01-product-contract.md`  
**Project:** `harisx404-portfolio`  
**Phase:** Phase 1 — Product Contract & Visual Design  
**Status:** Approved & Implemented for Review  

---

## 1. Product Contract & Assistant Identity

### 1.1 Persona & Public Identity
- **Public Name:** `Harisx404 AI Assistant` (UI display: **"Ask Haris."**)
- **Overline Badge:** `Portfolio Assistant` (monospace, uppercase, tracking-widest with status dot)
- **Role:** An AI portfolio guide representing Muhammad Haris's verified software engineering work, public case studies, technical skills, education, and contact channels.
- **Tone & Voice:**
  - Clear, concise, helpful, and technically articulate.
  - Humble and fact-grounded: never boasts or makes unsubstantiated claims.
  - Transparent: explicitly differentiates between verified facts about Haris and general computer science explanations.
  - Abstention policy: if asked about unverified details, personal life, or unreleased private work, gracefully declines and offers direct contact links (`/contact`).

### 1.2 Greeting & Suggested Prompts
- **First-Open Greeting Card:**
  - Heading: *"Curious about the work?"*
  - Body: *"Ask about projects, technical skills, writing, or how to get in touch."*
- **Quick Suggested Prompts:**
  1. **Explore featured projects:** *"What featured projects has Haris built, like TourMate or Mail-Lens?"*
  2. **Technical skills & stack:** *"What technologies, languages, and frameworks does Haris specialize in?"*
  3. **Contact & collaboration:** *"How can I contact Haris or collaborate with him?"*

---

## 2. Visual Design & Dimensional Launcher

### 2.1 Assistant Launcher Orb Design
The launcher button replaces the basic `MessageCircle` icon with an engineered **Dimensional Assistant Orb Mark**:
- **Layered SVG Architecture:**
  - **Outer Orbital Ring:** 28px dashed orbit rotating at a slow, restrained speed (`animate-[spin_20s_linear_infinite]`).
  - **Dimensional Core Sphere:** Multi-stop radial/linear gradient (`#8B5CF6` $\to$ `#6C47FF` $\to$ `#4F46E5`).
  - **Gloss Specular Highlight:** Soft elliptical curvature overlay providing 3D depth and glassmorphism sheen.
  - **Illuminated Cyber Visor:** Pill visor gradient (`#06B6D4` $\to$ `#3B82F6`) with dual specular reflections.
  - **Antenna Beacon:** Fine micro-sensor detail anchored to top apex.
  - **Active Status Indicator:** Live emerald online dot (`bg-emerald-400`) with subtle pulsing ripple.
- **Typography & Capsule Geometry:**
  - Sturdy pill shape with high contrast backdrop (`bg-text-primary text-bg-primary`).
  - Two-tier typography: Primary bold label (*"Ask Haris AI"*) + monospace sub-label (*"ASSISTANT"*).
  - Subtle hover lift (`hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(108,71,255,0.25)]`).

### 2.2 Theme & Accessibility Conformance
- **Light Theme:** Deep charcoal pill on white/gray canvas with vibrant purple/indigo assistant orb.
- **Dark Theme:** Crisp white pill on dark canvas (`#0d0d0f`) with high-contrast text and glowing purple accents.
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected:
  - Orb rotation and hover transformations are completely disabled (`motion-reduce:animate-none motion-reduce:transform-none`).
  - Pings and pulses fall back to static solid shapes.
- **Keyboard Navigation:** Full support for `Tab`, visible focus ring (`focus-visible:ring-2 focus-visible:ring-purple-primary`), `Escape` to close and return focus to launcher, and `Enter` / `Shift+Enter` composer navigation.

---

## 3. Responsive Viewport Matrix

| Viewport Class | Device Profiles | Dimensions | Panel Width | Panel Height | UX Behavior |
|---|---|---|---|---|---|
| **Ultra-Mobile** | iPhone SE, Galaxy Fold | 320px–360px | `calc(100vw - 24px)` (~296px–336px) | `calc(100dvh - 104px)` | Full-width clamped; compact padding (px-3 py-3); composer remains pinned above mobile browser bar. |
| **Standard Mobile** | iPhone 14/15/16, Pixel 8 | 375px–430px | `calc(100vw - 24px)` (~351px–406px) | `calc(100dvh - 104px)` | Uses `dvh` to ensure mobile URL bar does not obscure textarea; auto-scrolls on new message. |
| **Tablet** | iPad Mini, iPad Pro | 768px–1024px | `400px` | `580px` | Compact floating panel anchored to bottom-right corner (`bottom-6 right-6`). |
| **Desktop / Wide** | Laptops, 1440p, 4K | 1280px–2560px+ | `400px` | `580px` | High-elevation shadow (`shadow-[0_24px_80px_rgba(0,0,0,0.55)]`), smooth backdrop blur, hover lifts. |

---

## 4. Interaction States Specification

1. **Closed State:** Floating launcher pill visible at bottom right (`z-[5500]`).
2. **Open State:** Panel animates into view; input field automatically requests focus if on pointer/desktop device; backdrop remains interactive.
3. **Typing / Active State:** Textarea auto-expands up to 28 rows; send button activates once trimmed input length $> 0$.
4. **Loading State:** Input disabled; animated status dot pulses with *"Finding an answer..."* announced to screen readers via `role="status"`.
5. **Streaming State (Target for Phase 5):** Successive tokens appended seamlessly; auto-scroll remains locked to bottom unless user manually scrolls up.
6. **Error State:** Distinct alert banner (`role="alert"`) displaying polite recovery message with an inline *"Retry question"* button.
7. **Offline / Fallback State:** If AI providers are unavailable, clean fallback card offers direct internal links to `/projects`, `/resume`, and `/contact`.

---

## 5. Review Acceptance Criteria

- [x] Assistant identity and greeting defined.
- [x] Dimensional launcher mark engineered in lightweight inline SVG/CSS.
- [x] Light and dark modes verified with high contrast.
- [x] Reduced-motion support implemented.
- [x] All existing automated boundary and accessibility tests preserved.
