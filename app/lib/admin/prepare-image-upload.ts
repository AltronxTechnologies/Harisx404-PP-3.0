/** Best-effort browser conversion of large raster images before upload.
 * High-quality WebP may reduce transfer size, but gateway limits and visual
 * equivalence depend on the actual image and must be verified separately. */

const MAX_SAFE_UPLOAD_BYTES = 800 * 1024; // 800 KB threshold
const MAX_DIMENSION_PX = 3840; // 4K Ultra-HD retina max dimension
const WEBP_QUALITY = 0.94; // 94% studio master quality (pristine visual clarity)

export async function prepareImageForUpload(file: File): Promise<File> {
  // If not running in a browser environment, return original safely
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  // Preserve vector graphics (SVGs must never be rasterized)
  if (file.type === "image/svg+xml" || /\.svgz?$/i.test(file.name)) {
    return file;
  }

  // Preserve animated GIFs
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) {
    return file;
  }

  // Canvas exports a single frame; animated WebP must stay intact.
  if (file.type === "image/webp" || /\.webp$/i.test(file.name)) {
    return file;
  }

  // Non-images should pass through untouched
  if (file.type && !file.type.startsWith("image/")) {
    return file;
  }

  // Avoid recompression of smaller files; the gateway limit is not known here.
  if (file.size <= MAX_SAFE_UPLOAD_BYTES) {
    return file;
  }

  try {
    return await convertImageToWebP(file);
  } catch (error) {
    // Fail safe: if anything goes wrong, return the original file
    console.warn("Client-side image preparation fallback to original:", error);
    return file;
  }
}

function convertImageToWebP(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const finish = (result: File) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };
    const timeout = setTimeout(() => finish(file), 8000);

    img.onload = () => {
      try {
        let { naturalWidth: width, naturalHeight: height } = img;
        if (!width || !height) {
          width = img.width;
          height = img.height;
        }

        if (!width || !height) {
          finish(file);
          return;
        }

        // Scale down proportionally only if image exceeds the 3840px limit.
        if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION_PX) / width);
            width = MAX_DIMENSION_PX;
          } else {
            width = Math.round((width * MAX_DIMENSION_PX) / height);
            height = MAX_DIMENSION_PX;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = (canvas.getContext("2d", { willReadFrequently: false, alpha: true }) || canvas.getContext("2d")) as CanvasRenderingContext2D | null;
        if (!ctx || typeof canvas.toBlob !== "function") {
          finish(file);
          return;
        }

        // High-quality image rendering interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (settled) return;
            if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
              finish(file);
              return;
            }

            try {
              const baseName = file.name.replace(/\.[^/.]+$/, "").slice(0, 250);
              finish(new File([blob], `${baseName}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              }));
            } catch {
              finish(file);
            }
          },
          "image/webp",
          WEBP_QUALITY
        );
      } catch {
        finish(file);
      }
    };

    img.onerror = () => {
      finish(file);
    };

    try {
      img.src = objectUrl;
    } catch {
      finish(file);
    }
  });
}
