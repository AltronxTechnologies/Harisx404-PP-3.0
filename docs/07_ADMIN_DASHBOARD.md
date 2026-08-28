# ??? Admin Dashboard Specification

---

## 1. Overview

The admin dashboard lives at `/admin` and is only accessible to the authenticated admin user.
It is built entirely with the same Next.js + Tailwind CSS stack — no external admin frameworks.

---

## 2. Admin Routes

| Route | Component | Purpose |
|---|---|---|
| /admin | AdminDashboard | Overview: stats, recent posts, quick actions |
| /admin/blog | AdminBlogList | All posts: title, status, date, views, actions |
| /admin/blog/new | AdminBlogEditor | Create new post |
| /admin/blog/[slug] | AdminBlogEditor | Edit existing post |
| /admin/projects | AdminProjectList | All projects: title, status, actions |
| /admin/projects/new | AdminProjectEditor | Create new project |
| /admin/projects/[slug] | AdminProjectEditor | Edit existing project |
| /admin/media | AdminMediaLibrary | Upload + browse all media |
| /admin/about | AdminAboutEditor | Edit about page sections |
| /admin/toolbox | AdminToolboxManager | Manage tools list |
| /admin/connections | AdminConnectionsManager | Manage people connections |
| /admin/settings | AdminSettings | Site metadata, social links |
| /admin/analytics | AdminAnalytics | Views, popular posts, reactions |

---

## 3. Admin Layout

```
+------------------------------------------------------+
¦  TOPBAR: Site name | Page title | User avatar | Sign out ¦
+------------------------------------------------------¦
¦ SIDEBAR    ¦                                         ¦
¦            ¦  MAIN CONTENT AREA                      ¦
¦ Dashboard  ¦                                         ¦
¦ Blog       ¦  Page-specific content renders here     ¦
¦ Projects   ¦                                         ¦
¦ Media      ¦                                         ¦
¦ About      ¦                                         ¦
¦ Toolbox    ¦                                         ¦
¦ Connections¦                                         ¦
¦ Settings   ¦                                         ¦
¦ Analytics  ¦                                         ¦
+------------------------------------------------------+
```

---

## 4. Blog Editor Specification

### Editor Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Title | Text input | Yes | Auto-generates slug |
| Slug | Text input | Yes | URL-friendly, editable |
| Summary | Textarea | Yes | Max 160 chars, used in cards |
| Content | Tiptap rich editor | Yes | Supports MDX-like components |
| Cover Image | Media picker | No | From Cloudinary media library |
| Tags/Categories | Multi-select | No | From tags table |
| Status | Select | Yes | Draft / Published |
| Published At | Date picker | No | Schedule future posts |
| Featured | Checkbox | No | Shows on homepage |
| Canonical URL | Text input | No | For SEO |
| Audio File | Text input | No | Optional audio narration |

### Tiptap Editor Features
- Bold, Italic, Underline, Strikethrough
- Headings (H1, H2, H3)
- Bullet list, Numbered list
- Code block with syntax highlighting
- Blockquote
- Link insertion
- Image insertion (from media library)
- Table
- Horizontal rule

### AI Assist Buttons (Phase 4)
- "Improve this paragraph" (selected text)
- "Generate summary" (from content)
- "Suggest title" (from content)
- "Suggest tags" (from content)

---

## 5. Project Editor Specification

### Project Fields
| Field | Type | Required |
|---|---|---|
| Title | Text input | Yes |
| Slug | Text input | Yes |
| Description (short) | Textarea | Yes |
| Content (long / case study) | Tiptap editor | No |
| Cover Image | Media picker | No |
| Image Gallery | Multi-image picker | No |
| Live URL | Text input | No |
| GitHub URL | Text input | No |
| Tech Stack Tags | Multi-select | No |
| Status | Select | Yes |
| Featured | Checkbox | No |
| Display Order | Number | No |
| Start Date | Date | No |
| End Date | Date | No |

---

## 6. Media Library Specification

### Features
- Grid view of all Cloudinary images
- Upload new image (drag and drop or file picker)
- Filter by folder (blog, projects, profile, etc.)
- Click to copy Cloudinary URL
- Delete image (also removes from Cloudinary)
- Alt text editing per image
- Image details panel: size, dimensions, format, upload date

### Upload Flow
1. Admin selects file in browser
2. File sent to /api/upload route (server-side)
3. Server uploads to Cloudinary using API credentials
4. Cloudinary returns public_id, URL, dimensions
5. Record saved to media table in Supabase
6. Image appears in media library grid

---

## 7. Dashboard Overview Page

### Stats Cards
- Total Blog Posts (published vs draft)
- Total Projects
- Total Views (all time)
- Total Reactions (all time)

### Quick Actions
- "New Blog Post" button
- "New Project" button
- "Upload Media" button

### Recent Activity
- Last 5 blog posts (with status, views)
- Last 5 projects

### Popular Posts
- Top 5 by view count
- Top 5 by reaction count

---

## 8. Authentication Protection

### Middleware Protection (middleware.ts)
```typescript
// Protect all /admin/* routes
const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
const isLoginPage = request.nextUrl.pathname === '/admin/login';

if (isAdminRoute && !isLoginPage) {
  const session = await getSupabaseSession(request);
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  // Additional check: is this the admin email?
  const adminEmail = process.env.ADMIN_EMAIL;
  if (session.user.email !== adminEmail) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

### Environment Variable
```env
ADMIN_EMAIL=your-real-admin@email.com
```
