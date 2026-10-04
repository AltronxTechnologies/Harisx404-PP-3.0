import type { Metadata } from "next";
import "@uiw/react-md-editor/markdown-editor.css";
import "./admin-theme.css";

export const metadata: Metadata = {
  title: "Admin Portal",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-root className="dark">
      <style>{`
        html:has([data-admin-root]), body:has([data-admin-root]) { background: #0d0d0f; }
        body:has([data-admin-root]) { max-width: none; margin: 0; }
        body:has([data-admin-root]) > div:has(> div > #main-content) { border: 0; overflow: visible; }
        body:has([data-admin-root]) > div:has(> div > #main-content) > header,
        body:has([data-admin-root]) > div:has(> div > #main-content) > footer,
        body:has([data-admin-root]) > div:has(> div > #main-content) > footer ~ div,
        body:has([data-admin-root]) > div:has(> button[aria-label="Toggle chat"]) { display: none; }
        body:has([data-admin-root]) > div:has(> div > #main-content) > div:has(> #main-content) { display: block; }
        body:has([data-admin-root]) > div:has(> div > #main-content) > div:has(> #main-content) > :not(#main-content) { display: none; }
        body:has([data-admin-root]) #main-content { padding: 0; min-height: 100vh; }
      `}</style>
      {children}
    </div>
  );
}
