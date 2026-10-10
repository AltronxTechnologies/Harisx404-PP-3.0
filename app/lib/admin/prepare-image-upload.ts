/** Best-effort WebP conversion for still JPEG/PNG uploads. Keep the original
 * when the result is larger, the browser cannot encode WebP, or animation is present. */

const MAX_DIMENSION_PX = 3840; // 4K Ultra-HD retina max dimension
const WEBP_QUALITY = 0.94; // 94% studio master quality (pristine visual clarity)

async function isAnimatedPng(file: File): Promise<boolean> {
  // APNG's acTL chunk precedes the first IDAT. If the header is too large to
  // reach IDAT, preserve the source rather than risk flattening its frames.
  const bytes = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  if (bytes.length < 8 || ![137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === "acTL") return true;
    if (type === "IDAT") return false;
    if (length > bytes.length - offset - 12) return true;
    offset += length + 12;
  }
  return true;
}

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

  // AVIF, HEIC, TIFF and other multi-frame or already efficient formats are
  // kept intact. Canvas would otherwise silently export only their first frame.
  const jpeg = file.type === "image/jpeg" || (file.type === "" && /\.jpe?g$/i.test(file.name));
  const png = file.type === "image/png" || (file.type === "" && /\.png$/i.test(file.name));
  if (!jpeg && !png) return file;

  try {
    if (png && await isAnimatedPng(file)) return file;
    return await convertImageToWebP(file);
  } catch {
    // Browser support varies; a failed optimization must not block uploads.
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
