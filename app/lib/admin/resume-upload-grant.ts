import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { RESUME_MAX_BYTES } from "@/app/data/resume";

export const resumeGrantSchema = z.object({
  path: z.string().regex(/^documents\/[0-9a-f-]{36}\.pdf$/),
  filename: z.string().min(1).max(180),
  sizeBytes: z.number().int().min(1).max(RESUME_MAX_BYTES),
  expectedPath: z.string().nullable(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  expiresAt: z.number().int(),
  proof: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

type Grant = z.infer<typeof resumeGrantSchema>;
type GrantPayload = Omit<Grant, "proof">;

export function resumeUploadProof(grant: GrantPayload) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Resume upload is not configured");
  return createHmac("sha256", key).update(JSON.stringify([
    grant.path, grant.filename, grant.sizeBytes, grant.expectedPath, grant.expectedUpdatedAt, grant.expiresAt,
  ])).digest("hex");
}

export function validResumeGrant(grant: Grant) {
  if (grant.expiresAt <= Date.now() || grant.expiresAt > Date.now() + 60 * 60_000) return false;
  const expected = Buffer.from(resumeUploadProof(grant), "hex");
  return timingSafeEqual(expected, Buffer.from(grant.proof, "hex"));
}
