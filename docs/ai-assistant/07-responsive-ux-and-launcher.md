# Responsive UX, Animated Launcher & Accessibility Specification

**Phase:** Phase 6 — Complete the Animated Launcher and Responsive UX  
**Status:** Implemented & Verified  
**Date:** October 10, 2026  
**Component:** `app/components/ChatbotWidget.tsx` & `tests/ai-responsive-ux.test.mjs`

---

## 1. Executive Summary

Phase 6 polishes the AI assistant's frontend visual presentation, viewport responsiveness, focus management, and scroll ergonomics. Key enhancements include an inline SVG vector launcher (`AssistantOrb`) with ambient rotation and reduced-motion fallbacks, intelligent scroll-follow behavior with a floating "Jump to latest" affordance, offline connectivity detection, and safe inline markdown rendering without raw HTML parsing.

---

## 2. Animated Launcher Design System

The launcher button provides a polished, restrained appearance that aligns with the portfolio's aesthetic without distracting from the primary content.

### 2.1 Vector Icon Architecture (`AssistantOrb`)
Rather than pulling in heavy 3D rendering engines (Three.js, React Three Fiber) that add hundreds of kilobytes to the bundle:
- **Geometry:** Multi-layered inline SVG with linear gradients (`#8B5CF6` to `#4F46E5`).
- **Ambient Ring:** 14px radius dashed orbit rotating gently (`animate-[spin_20s_linear_infinite]`).
- **Visor & Eyes:** Cyber visor (`#06B6D4` to `#3B82F6`) with dual specular white ocular dots.
- **Status Beacon:** Emerald indicator with subtle ping animation (`bg-emerald-400`).
- **Reduced Motion:** All spin, ping, and hover tilt animations automatically disable when `prefers-reduced-motion: reduce` is active (`motion-reduce:animate-none`, `motion-reduce:transform-none`, `motion-reduce:hidden`).

### 2.2 Launcher States
| State | Visual Treatment |
|:---|:---|
| **Resting** | Pill container (`rounded-full`), dark surface in light mode, high-contrast border. |
| **Hover** | Subtle -2px lift (`hover:-translate-y-0.5`), purple glow (`shadow-[0_16px_40px_rgba(108,71,255,0.25)]`). |
| **Focus** | High-visibility keyboard focus ring (`focus-visible:outline-purple-primary`, 2px offset). |
| **Touch** | Tap target meeting WCAG 2.2 touch-target size requirements ($\ge 44 \times 44\text{ px}$, actual $56\text{ px}$ height). |

---

## 3. Viewport & Responsive Layout Matrix

### 3.1 Dimensions & Dynamic Viewport Height (`dvh`)
- **Desktop Viewports ($\ge 640\text{px}$):**
  - Position: `fixed bottom-6 right-6 z-[5500]`
  - Width: `min(400px, calc(100vw - 24px))`
  - Height: `min(580px, calc(100dvh - 104px))`
- **Mobile Viewports ($< 640\text{px}$, 320px–428px):**
  - Position: `fixed bottom-3 right-3 z-[5500]`
  - Takes advantage of dynamic viewport units (`100dvh`) to prevent address bar shifting and virtual keyboard displacement.
  - Sizing leaves header, close control, and textarea reachable at all times.
- **Overscroll Containment:**
  - `overscroll-contain` on message list prevents mobile scroll-chaining from scrolling the background portfolio page while reading long responses.

---

## 4. Intelligent Scroll-Follow & "Jump to Latest" Affordance

A common defect in streaming interfaces is forcibly snapping the viewport to the bottom when new tokens arrive, preventing the user from reading earlier messages or copying text.

### 4.1 Near-Bottom Detection
```tsx
function handleScroll() {
  const scroller = scrollRef.current;
  if (!scroller) return;
  const nearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48;
  setIsAtBottom(nearBottom);
}
```

### 4.2 Auto-Scroll vs. User-Preserved Position
- If `isAtBottom === true`: New streaming tokens smoothly scroll down with the response.
- If `isAtBottom === false` (user scrolled up): Auto-scrolling is paused to respect user reading position.
- A floating pill button (`"Jump to latest"`) appears dynamically above the input form with an `ArrowDown` indicator. Clicking it smoothly animates to the latest tokens and re-enables auto-scroll.

---

## 5. Keyboard Navigation & Focus Management

- **Opening Chat:** On desktop and pointer devices, focus automatically moves to the message input textarea (`inputRef.current?.focus()`).
- **Closing Chat:** Clicking the X close button or pressing the `Escape` key closes the panel and immediately restores keyboard focus to the launcher button (`toggleRef.current?.focus()`).
- **Keyboard Submission:** `Enter` submits the question; `Shift+Enter` inserts a newline for multiline composition.
- **Accessible Names:** Close button has explicit `aria-label="Close chat"`; send button has `aria-label="Send chat message"`; stop button has `aria-label="Stop generating response"`; launcher button has `aria-label="Toggle chat"` with `aria-expanded` and `aria-controls`.

---

## 6. Offline Detection & Safe Markdown Formatting

### 6.1 Network Disconnect Awareness
- Hooks listen to browser `offline` events and check `navigator.onLine` before dispatching.
- If disconnected, presents an informative alert: *"You appear to be offline. Please check your internet connection."* with a Retry button.

### 6.2 XSS-Safe Markdown Rendering
- Output is rendered strictly without `dangerouslySetInnerHTML`.
- Inline code (`` `code` ``) is rendered with monospace styling.
- Bold text (`**text**`) is rendered with bold typography.
- Verified portfolio routes (`/projects`, `/resume`, `/credentials`, `/blog`, `/contact`) are mapped to accessible Next.js `<Link>` components.

---

## 7. Verification Evidence

- **All 5 Test Suites Passing (25/25 Tests):**
  ```bash
  node --test tests/ai-responsive-ux.test.mjs tests/ai-streaming-protocol.test.mjs tests/ai-security-hardening.test.mjs tests/chat-provider-fallback.test.mjs tests/public-auth-ai-boundaries.test.mjs
  ```
  - `ok 1-7`: Accessible launcher, SVG orb with reduced-motion, responsive panel bounds, focus restoration, scroll tracking, offline protection, XSS-safe rendering.
  - `ok 8-16`: Security checks, streaming protocol, failover, chunk reassembly.
  - `ok 17-21`: Non-streaming fallback, honesty, timeout resilience.
  - `ok 22-25`: SSR markup integrity, OAuth safety, and boundary checks.
- **TypeScript:** `npx tsc --noEmit` $\to$ **0 errors**.
- **Linting:** `npm run lint` $\to$ **0 errors or warnings**.
