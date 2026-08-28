"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import * as z from "zod";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";
import { checkRateLimit } from "@/app/lib/rate-limit";

/**
 * Public testimonial submission.
 *
 * Flow: visitor submits → row is inserted with status 'pending' via the
 * service-role client (the anon key has no INSERT policy on this table) →
 * it stays invisible on the site (public SELECT policy filters
 * status = 'published') until the owner approves it in /admin/testimonials.
 *
 * Abuse protection: honeypot field, per-IP rate limit, strict zod limits
 * that mirror the card layout constraints (2-line headline, 6-line quote).
 */

const submissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "Name must be 80 characters or fewer."),
  role: z
    .string()
    .trim()
    .min(2, "Please enter your role or company.")
    .max(80, "Role must be 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email.")
    .max(120, "Email must be 120 characters or fewer."),
  headline: z
    .string()
    .trim()
    .min(8, "Headline must be at least 8 characters.")
    .max(70, "Headline must be 70 characters or fewer."),
  quote: z
    .string()
    .trim()
    .min(40, "Please write at least 40 characters so it's meaningful.")
    .max(280, "Testimonial must be 280 characters or fewer."),
  // Honeypot — real users never see or fill this field.
  website: z.string().optional(),
});

export type TestimonialSubmissionInput = z.infer<typeof submissionSchema>;

export type TestimonialSubmissionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Avatar strategy for public submissions (no file uploads on purpose —
 * letting anonymous visitors upload images is a moderation/storage risk):
 *
 * 1. If the submitter provided an email, look up their Gravatar. With
 *    `d=404` Gravatar returns 404 when no photo is registered, so we only
 *    store the URL when a real profile photo exists.
 * 2. Otherwise avatar_url stays null and the card renders its built-in
 *    initials fallback (tinted circle with the person's initials).
 * 3. The owner can always attach a proper photo later by editing the
 *    testimonial in the admin panel (Media Picker).
 */
async function resolveGravatar(email: string): Promise<string | null> {
  try {
    const hash = createHash("sha256")
      .update(email.trim().toLowerCase())
      .digest("hex");
    const url = `https://www.gravatar.com/avatar/${hash}?d=404&s=160`;
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok ? url : null;
  } catch {
    // Network hiccup — never block the submission over an avatar.
    return null;
  }
}

/**
 * Owner notification via Loops when a new testimonial lands in the
 * moderation queue. Intentionally awaited (on serverless platforms an
 * un-awaited promise may be killed when the response is sent) but hard
 * capped at 5s and wrapped so a mail failure can never fail the
 * visitor's submission. Requirements (both optional — this no-ops
 * silently if either is missing):
 *   - LOOPS_API_KEY (already used by the newsletter integration)
 *   - LOOPS_TESTIMONIAL_TRANSACTIONAL_ID: create a Transactional email
 *     in the Loops dashboard (Transactional -> New) with data variables
 *     {name} {role} {headline} {quote} {submitterEmail}, then put its
 *     ID in this env var.
 * The notification is sent to ADMIN_EMAIL.
 */
async function notifyOwnerOfSubmission(data: {
  name: string;
  role: string;
  headline: string;
  quote: string;
  email: string;
}) {
  const apiKey = process.env.LOOPS_API_KEY;
  const transactionalId = process.env.LOOPS_TESTIMONIAL_TRANSACTIONAL_ID;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!apiKey || !transactionalId || !adminEmail) return;
  try {
    await fetch("https://app.loops.so/api/v1/transactional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        transactionalId,
        email: adminEmail,
        dataVariables: {
          name: data.name,
          role: data.role,
          headline: data.headline,
          quote: data.quote,
          submitterEmail: data.email,
        },
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    // Log without leaking submission content or keys.
    console.error("Testimonial notification email failed:", err);
  }
}

export async function submitTestimonial(
  input: TestimonialSubmissionInput,
): Promise<TestimonialSubmissionResult> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  // Honeypot filled → almost certainly a bot. Pretend success, store nothing.
  if (data.website) {
    return { success: true };
  }

  // Per-IP rate limit: 3 submissions per 10 minutes.
  try {
    const headerList = await headers();
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "unknown";
    const limit = checkRateLimit(`testimonial-submit:${ip}`, {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.success) {
      return {
        success: false,
        error: "Too many submissions. Please try again in a few minutes.",
      };
    }
  } catch {
    // headers() unavailable — continue; validation still protects us.
  }

  try {
    const supabase = await createSupabaseAdminClient();

    const avatarUrl = data.email ? await resolveGravatar(data.email) : null;

    const fullRow = {
      headline: data.headline,
      quote: data.quote,
      name: data.name,
      role: data.role || null,
      avatar_url: avatarUrl,
      email: data.email || null,
      source: "public",
      status: "pending",
      display_order: 999,
    };

    let { error } = await supabase.from("testimonials").insert([fullRow]);

    // Graceful fallback if the submissions migration hasn't been applied
    // yet (email/source columns missing): keep the moderation guarantee
    // (status 'pending') and drop only the optional metadata columns.
    if (error && /column|schema cache/i.test(error.message)) {
      const { email: _email, source: _source, ...minimalRow } = fullRow;
      ({ error } = await supabase.from("testimonials").insert([minimalRow]));
    }

    if (error) throw error;

    // Notify the owner (time-capped; a failure never fails the submission).
    await notifyOwnerOfSubmission({
      name: data.name,
      role: data.role,
      headline: data.headline,
      quote: data.quote,
      email: data.email,
    });

    return { success: true };
  } catch (err) {
    console.error("Testimonial submission failed:", err);
    return {
      success: false,
      error:
        "Something went wrong while saving your testimonial. Please try again later.",
    };
  }
}
