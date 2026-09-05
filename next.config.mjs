/** @type {import('next').NextConfig} */
const config = {
  trailingSlash: false,
  // Allows CI/verification builds to run alongside the dev server without
  // clobbering its .next dir (e.g. NEXT_DIST_DIR=.next-build npx next build)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.hashnode.com",
      },
      {
        protocol: "https",
        hostname: "media.giphy.com",
      },
      {
        protocol: "https",
        hostname: "dev-to-uploads.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "badges.pufler.dev",
      },
      {
        protocol: "https",
        hostname: "img.shields.io",
      },
      {
        protocol: "https",
        hostname: "framerusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      // Handle trailing slashes on blog posts (Google Search Console 404s)
      {
        source: "/blog/:slug/",
        destination: "/blog/:slug",
        permanent: true,
      },
      // Redirect index.html to root
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      // Changelog renamed to Buildlog
      {
        source: "/changelog",
        destination: "/buildlog",
        permanent: true,
      },
      // Guestbook parity route → community wall
      {
        source: "/guestbook",
        destination: "/community-wall",
        permanent: false,
      },
      // Newsletter redirect (no dedicated page)
      {
        source: "/newsletter",
        destination: "/",
        permanent: true,
      },
      {
        source: "/newsletter/",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default config;
