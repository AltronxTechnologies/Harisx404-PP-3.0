import Link from "next/link";
import Image from "next/image";
import { SocialPill } from "./SocialPill";
import { GridWrapper } from "./GridWrapper";

interface FooterLink {
  href: string;
  label: string;
  isExternal?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: "General",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/projects", label: "Projects" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Specifics",
    links: [
      { href: "/links", label: "Links" },
      { href: "/contact", label: "Contact" },
      { href: "/resume", label: "Resume" },
      { href: "/credentials", label: "Credentials" },
    ],
  },
  {
    title: "Extra",
    links: [
      { href: "/stats", label: "Stats" },
      { href: "/buildlog", label: "Buildlog" },
      { href: "/community-wall", label: "Community\nWall" },
      { href: "/test", label: "Test Page" },
    ],
  },
];

const metaLinks: FooterLink[] = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/attribution", label: "Attribution" },
  { href: "/sitemap.xml", label: "Sitemap" },
  { href: "/rss.xml", label: "RSS" },
];

export function Footer(): JSX.Element {
  const renderFooterLink = (link: FooterLink): JSX.Element => {
    const label = link.label.includes("\n") ? (
      <span className="whitespace-pre-line">{link.label}</span>
    ) : (
      link.label
    );
    if (link.isExternal) {
      return (
        <a href={link.href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    return <Link href={link.href}>{label}</Link>;
  };

  return (
    <>
      <footer className="relative max-w-7xl border-t border-gray-200 dark:border-white/10">
        <GridWrapper>
          <div className="max-w-6xl divide-y divide-gray-200 px-4 dark:divide-white/10 lg:mx-auto lg:flex lg:divide-x lg:divide-y-0 lg:px-4 xl:px-0">
            {/* Left brand & bio area */}
            <div className="flex w-full flex-col py-8 pb-10 text-sm md:py-6 md:pb-10 lg:pr-16">
              <Link className="inline-block w-fit" href="/" aria-label="Home">
                <Image
                  src="/brand/harisx404 black transparent.png"
                  alt="Muhammad Haris Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain dark:hidden"
                />
                <Image
                  src="/brand/harisx404 white transparent.png"
                  alt="Muhammad Haris Logo"
                  width={40}
                  height={40}
                  className="hidden h-10 w-10 object-contain dark:block"
                />
              </Link>
              <p className="mt-6 max-w-xs leading-6 text-gray-500 dark:text-gray-400">
                I&apos;m Muhammad Haris &mdash; I build for the web, secure
                what I ship, and teach machines to think. Three domains, one
                mission: solving hard problems.
              </p>
              <div className="mt-8 w-fit">
                <SocialPill />
              </div>
            </div>

            {/* Right navigation link columns */}
            <nav
              aria-label="Footer"
              className="flex w-full flex-col py-8 pb-10 md:py-6 md:pb-10 lg:pl-16"
            >
              <div className="flex w-full flex-wrap justify-between gap-x-4 gap-y-8 sm:gap-x-8">
                {footerSections.map((section) => (
                  <div key={section.title} className="min-w-0">
                    <span className="mb-3 inline-block text-sm font-medium text-text-primary sm:mb-4 sm:text-base">
                      {section.title}
                    </span>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <span className="inline-block py-1 text-sm text-gray-500 transition-colors hover:text-text-primary dark:text-gray-400">
                            {renderFooterLink(link)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </div>

          {/* Bottom bar — copyright + meta links, above the hatch strip */}
          <div className="max-w-6xl border-t border-gray-200 px-4 dark:border-white/10 lg:mx-auto xl:px-0">
            <div className="flex flex-col items-center justify-between gap-3 py-5 font-mono text-xs tracking-wide text-gray-500 dark:text-gray-400 sm:flex-row">
              <p>&copy; {new Date().getFullYear()} Harisx404. All rights reserved.</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {metaLinks.map((link, index) => {
                  const isFile = link.href.endsWith(".xml");
                  return (
                    <span key={link.href} className="flex items-center gap-2">
                      {index > 0 && <span aria-hidden="true">&middot;</span>}
                      {isFile ? (
                        <a
                          href={link.href}
                          className="inline-block py-1 transition-colors hover:text-text-primary"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-block py-1 transition-colors hover:text-text-primary"
                        >
                          {link.label}
                        </Link>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </GridWrapper>
      </footer>
      <div className="relative h-8 w-full [background-image:linear-gradient(45deg,theme(colors.border-primary)_12.50%,transparent_12.50%,transparent_50%,theme(colors.border-primary)_50%,theme(colors.border-primary)_62.50%,transparent_62.50%,transparent_100%)] [background-size:5px_5px]" />
    </>
  );
}
