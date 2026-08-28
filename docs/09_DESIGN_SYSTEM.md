# ?? Design System

---

## 1. Current Design System (From Braydon Coyer Template)

### Color Tokens (app/globals.css)
The site uses Tailwind CSS with custom CSS variables for theming.

Key color classes:
- `text-text-primary` — main heading/body text
- `text-text-secondary` — muted/secondary text
- `bg-bg-primary` — page background
- `border-border-primary` — borders and dividers
- `text-indigo-600` — accent/highlight color (section labels)

### Typography
- **Font:** Geist Sans (body), Geist Mono (code)
- **Loaded via:** geist npm package (NOT Google Fonts CDN)
- **Scale:** Default Tailwind typography scale

### Layout
- Max width: `max-w-7xl` (1280px)
- Main layout: `lg:grid-cols-[32px_1fr_32px]` — side decorative columns with content in middle
- Padding: `px-3` mobile, `lg:px-0` desktop

---

## 2. Design Decisions (Do Not Change Without User Approval)

| Element | Current | Change Allowed? |
|---|---|---|
| Color accent | Indigo-600 | User decides in Phase 6 |
| Fonts | Geist Sans + Mono | User decides in Phase 6 |
| Max width | 1280px | No |
| Bento card grid | Yes | User decides in Phase 6 |
| Dark mode | Not implemented (one mode only) | User decides in Phase 6 |

---

## 3. Component Inventory

All 60 components in app/components/:

### Layout Components
- `Navbar.tsx` — Top navigation with links
- `Footer.tsx` — Bottom footer with social links
- `GridWrapper.tsx` — Content wrapper with max-width centering
- `BgGradient.tsx` — Background gradient decoration
- `BgSectionTag.tsx` — Section background tag
- `PageSection.tsx` — Section wrapper
- `PageTitle.tsx` — Page title heading

### Bento Cards (Homepage)
- `AboutMeBento.tsx` — About me bento card
- `CalendarBento.tsx` — GitHub contribution-style calendar
- `ChangelogBento.tsx` — Recent changelog entries
- `CommunityWallBento.tsx` — Community notes wall
- `ConnectionsBento.tsx` — People/connections display
- `CurrentlyPlayingBento.tsx` — Spotify now playing
- `CurrentlyReadingBento.tsx` — Current book
- `ScrapbookBento.tsx` — Photo scrapbook
- `SpeakingBento.tsx` — Speaking engagements
- `StatsBento.tsx` — Site statistics
- `ToolboxBento.tsx` — Developer tools

### Blog Components
- `BlogPostList.tsx` — List of blog posts
- `FeaturedBlogCard.tsx` — Featured post card
- `CategorySelect.tsx` — Category filter
- `ArticleReactions.tsx` — Like/heart/celebrate/insightful buttons
- `ArticleReactionsWrapper.tsx` — Server wrapper for reactions
- `ViewCounter.tsx` — Article view count
- `TableOfContents.tsx` — Blog post TOC
- `CodePlayground.tsx` — Interactive code sandbox
- `AudioPlayer.tsx` — Article audio narration player
- `mdx.tsx` — MDX component renderers
- `mdx-content.tsx` — MDX content wrapper

### UI Components
- `BentoCard.tsx` — Base bento card wrapper
- `BorderCard.tsx` — Card with border
- `ShadowBox.tsx` — Card with shadow
- `Button.tsx` — Reusable button
- `Link.tsx` — Styled link
- `ContentLink.tsx` — Content-specific link
- `SectionTitlePill.tsx` — Section title pill badge
- `HorizontalLine.tsx` — Divider line
- `AnimatedText.tsx` — Framer Motion text animation
- `AnimatedProfilePicture.tsx` — Profile picture with animation
- `AnimatedMobilePhotos.tsx` — Mobile photo strip
- `Marque.tsx` — Marquee/scrolling text
- `Tabs.tsx` — Tab navigation
- `Timeline.tsx` — Timeline display
- `VideoCard.tsx` — Video preview card
- `SocialPill.tsx` — Social media link pill
- `SvgPatterns.tsx` — Decorative SVG patterns (67KB!)
- `AboutTrackPattern.tsx` — About section pattern
- `Details.tsx` — HTML details/summary

### Auth Components
- `SignInWithGitHub.tsx` — GitHub OAuth button
- `CreateCommunityNoteBuilder.tsx` — Community wall note creator
- `CommunityWallCard.tsx` — Community wall note card
- `CommunityWallModal.tsx` — Community wall modal

### Profile Components
- `ProfilePicture.tsx` — Profile picture with states
- `Photo.tsx` — Single photo display
- `PhotoGallery.tsx` — Multi-photo gallery
- `Resume.tsx` — Resume/CV display

### Newsletter
- `NewsletterSignUp.tsx` — Email signup form (Loops.so)

---

## 4. Phase 6 Design Decisions (Pending User Direction)

When the user is ready for Phase 6, they will direct:

1. **Color Scheme** — Keep indigo? Change to a personal brand color?
2. **Dark Mode** — Add dark/light toggle?
3. **Font** — Keep Geist? Switch to Inter, Space Grotesk, or other?
4. **Homepage Layout** — Keep bento cards? Different layout?
5. **Blog Cards** — Current style or redesign?
6. **Animations** — More/less animation?

**Rule:** Never make design changes in Phases 1-5. Keep the Braydon design as-is until Phase 6.

---

## 5. Admin Dashboard Design

The admin dashboard will use a separate, clean professional design:
- Dark sidebar with light main content (or vice versa)
- Table-based layouts for content lists
- Clean form design for editors
- No bento cards in admin — functionality first
- Same Geist font for consistency
