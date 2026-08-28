# Pending Content & Media Updates (Phase 5)

## Overview
This document tracks all the placeholder media and content elements that require manual intervention, usually through uploading specific personal media files to Cloudinary or updating local assets.

## Action Items

### 1. Update Profile & Avatar Images
*(DONE FOR NOW: We uploaded `Harisx404.png` to Cloudinary and used it as a placeholder everywhere per user request. We will update these properly with real images later.)*
- `braydon_headshot_1.jpeg` (Used in `Resume.tsx`) - **Replaced with Cloudinary URL**
- `braydon_headshot_3.jpg` (Used in `speaking/page.tsx`) - **Replaced with Cloudinary URL**
- `braydon_headshot_6.jpeg` (Used in `speaking/page.tsx`) - **Replaced with Cloudinary URL**
- `braydon_and_pj.jpeg` (Used in `about/page.tsx`) - **Replaced with Cloudinary URL**
- `braydon_speaking_photo.jpeg` (Used in `about/page.tsx`) - **Replaced with Cloudinary URL**
- `braydon_commit_your_code.jpeg` (Used in `speaking/page.tsx`) - **Replaced with Cloudinary URL**
- `braydon_react_miami_headshot.jpg` (Used in `speaking/page.tsx`) - **Replaced with Cloudinary URL**
- `braydon_stir_trek.jpeg` (Used in `speaking/page.tsx`) - **Replaced with Cloudinary URL**

*Note: All Github avatars have been replaced with the high-quality Cloudinary URL.*

### 2. Branding Elements
- **Site OG Image (`app/api/og/route.tsx`)**: Ensure your default Open Graph fallback image is created.
- **Monogram & Logo**: If applicable, replace the `Logo` component logic to use Haris' custom branding.

### 3. Contact & Connections
- Verify that `https://www.linkedin.com/in/harisx404/` accurately links to your profile.
- Add any missing specific social handles in `app/data/siteMetadata.ts`.
