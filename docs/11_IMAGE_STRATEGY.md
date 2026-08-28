# ??? Image and Media Strategy

---

## 1. Current Problem

All images currently live in `public/` as local files:
- 70+ image files in public/
- Some images over 1MB (unoptimized)
- Referenced by filename strings in code
- No image transformation/optimization
- Cannot manage images without file system access

---

## 2. Target: Cloudinary

### Why Cloudinary
- Images stored in the cloud — accessible forever
- Automatic WebP/AVIF conversion for modern browsers
- URL-based transformations (resize, crop, quality)
- Global CDN for fast delivery
- Free tier: 25GB storage, 25GB bandwidth/month
- Upgrade to paid: just raise limits, same URLs

### Cloudinary Account Setup
1. Go to https://cloudinary.com and create a free account
2. Get your Cloud Name, API Key, API Secret
3. Add to .env.local:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 3. Cloudinary Folder Structure

```
harisx404/
+-- profile/          — Profile photos
+-- blog/             — Blog post images
+-- projects/         — Project screenshots/images
+-- og/               — Open Graph images
+-- misc/             — Other images
```

---

## 4. Image Naming Convention

| Type | Convention | Example |
|---|---|---|
| Profile | profile/photo-N | profile/photo-1 |
| Blog cover | blog/post-slug | blog/how-to-use-tailwind |
| Project cover | projects/project-slug | projects/my-app |
| OG image | og/page-slug | og/blog-post-title |

---

## 5. Image Transformations (URL Parameters)

Cloudinary transforms images by adding parameters to the URL:

```
Base URL: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}

Blog thumbnail (800x450, WebP, quality 80):
/c_fill,w_800,h_450,q_80,f_auto/

Profile photo (400x400, circle crop):
/c_fill,w_400,h_400,r_max,q_80/

OG image (1200x630):
/c_fill,w_1200,h_630,q_85/
```

---

## 6. Next.js next/image Integration

```typescript
import Image from 'next/image';

// In next.config.mjs, add Cloudinary domain:
// images: {
//   remotePatterns: [
//     { hostname: 'res.cloudinary.com' }
//   ]
// }

// Usage:
<Image
  src={`https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_800,h_450,q_80,f_auto/${publicId}`}
  alt="Blog post cover"
  width={800}
  height={450}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."  // Cloudinary auto-blur via /e_blur:2000/
/>
```

---

## 7. Media Helper (app/lib/cloudinary.ts)

```typescript
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export function getCloudinaryUrl(
  publicId: string,
  transformations: string = 'q_auto,f_auto'
): string {
  return `${BASE_URL}/${transformations}/${publicId}`;
}

export function getBlogCoverUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, 'c_fill,w_800,h_450,q_80,f_auto');
}

export function getProfileUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, 'c_fill,w_400,h_400,r_max,q_80,f_auto');
}

export function getOgImageUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, 'c_fill,w_1200,h_630,q_85,f_auto');
}
```

---

## 8. Migration Plan (Existing public/ Images)

### Priority Order
1. Profile photos (used on homepage, bento cards)
2. OG image (used in metadata)
3. Blog cover images (64 blog posts)
4. Project images (2 currently, more to add)
5. Speaking/connections photos

### Migration Steps
1. Upload each image to Cloudinary (via dashboard or script)
2. Note the public_id for each uploaded image
3. Update references in code/database to use Cloudinary URLs
4. After verifying, remove original files from public/

### Bulk Upload Script
```bash
# Using Cloudinary CLI
npm install -g cloudinary-cli
cld config -n CLOUD_NAME -k API_KEY -s API_SECRET
cld uploader upload_large public/blog/ folder=harisx404/blog
```
