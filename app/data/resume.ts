export const RESUME_FILE_ROUTE = "/resume/file";
export const RESUME_DOWNLOAD_ROUTE = "/resume/file?download=1";
export const RESUME_STORAGE_BUCKET = "resume-documents";
export const RESUME_MAX_BYTES = 10 * 1024 * 1024;

export const FALLBACK_RESUME = {
  path: "/muhammad-haris-resume.pdf",
  filename: "Muhammad-Haris-Resume.pdf",
  sizeBytes: 1_375_194,
  updatedAt: "2026-09-24T00:00:00.000Z",
} as const;
