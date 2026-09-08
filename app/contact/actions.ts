"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { createHash, randomUUID } from "crypto";
import * as z from "zod";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const projectTypes = [
  "general-question",
  "project-inquiry",
  "freelance",
  "full-time",
  "security-report",
  "website-issue",
  "consulting",
  "collaboration",
  "other",
] as const;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80, "Name must be 80 characters or fewer."),
  email: z.string().trim().min(1, "Please enter your email.").email("Please enter a valid email.").max(120, "Email must be 120 characters or fewer."),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters.").max(120, "Subject must be 120 characters or fewer."),
  projectType: z.enum(projectTypes, { message: "Please choose an inquiry type." }),
  message: z.string().trim().min(30, "Please write at least 30 characters.").max(3000, "Message must be 3,000 characters or fewer."),
  website: z.string().max(200).optional(),
  requestId: z.string().uuid().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactResult =
  | { success: true; emailSent: boolean }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

const projectTypeLabels: Record<ContactInput["projectType"], string> = {
  "general-question": "General question",
  "project-inquiry": "Project inquiry",
  freelance: "Freelance project",
  "full-time": "Full-time opportunity",
  "security-report": "Security report",
  "website-issue": "Website issue",
  consulting: "Consulting request",
  collaboration: "Collaboration / partnership",
  other: "Other inquiry",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendOwnerEmail(data: ContactInput) {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const ownerEmail = process.env.ADMIN_EMAIL || "itsharis.tech@gmail.com";
  if (!host || !user || !pass || !Number.isFinite(port)) {
    throw new Error("SMTP is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  const safeMessage = escapeHtml(data.message).replaceAll("\n", "<br />");
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || user,
    to: ownerEmail,
    replyTo: data.email,
    subject: `[Portfolio contact] ${data.subject}`,
    text: `${data.name} (${data.email})\n${projectTypeLabels[data.projectType]}\n\n${data.message}`,
    html: `
      <h2>${escapeHtml(data.subject)}</h2>
      <p><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>
      <p><strong>Inquiry:</strong> ${projectTypeLabels[data.projectType]}</p>
      <p>${safeMessage}</p>
    `,
  });
}

export async function submitContactMessage(input: ContactInput): Promise<ContactResult> {
  if (input.website) return { success: true, emailSent: true };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;

  let supabase: Awaited<ReturnType<typeof createSupabaseAdminClient>>;
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for")?.split(",").at(-1)?.trim();
    const signal =
      headerList.get("cf-connecting-ip") ||
      headerList.get("x-vercel-forwarded-for") ||
      headerList.get("x-real-ip") ||
      forwarded ||
      "unknown";
    const signalHash = createHash("sha256")
      .update(`${process.env.SUPABASE_SERVICE_ROLE_KEY || "contact"}:${signal}`)
      .digest("hex");
    supabase = await createSupabaseAdminClient();
    const { data: allowed, error: rateError } = await supabase.rpc(
      "check_contact_message_rate_limit",
      { target_signal_hash: signalHash },
    );
    if (rateError) throw rateError;
    if (!allowed) {
      return { success: false, error: "Too many messages. Please try again in a few minutes." };
    }
  } catch (error) {
    console.error("Contact rate-limit check failed:", error);
    return {
      success: false,
      error: "Message submission is temporarily unavailable. Please try again shortly.",
    };
  }

  try {
    const requestId = data.requestId || randomUUID();
    const { data: stored, error } = await supabase
      .from("contact_messages")
      .insert({
        request_id: requestId,
        name: data.name,
        email: data.email,
        subject: data.subject,
        project_type: data.projectType,
        message: data.message,
      })
      .select("id")
      .single();

    if (error?.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("contact_messages")
        .select("email_status")
        .eq("request_id", requestId)
        .single();
      if (existingError || !existing) throw existingError || error;
      return { success: true, emailSent: existing.email_status === "sent" };
    }
    if (error || !stored) throw error || new Error("Message was not stored.");

    try {
      await sendOwnerEmail(data);
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          email_status: "sent",
          emailed_at: new Date().toISOString(),
          email_attempts: 1,
          next_email_attempt_at: null,
        })
        .eq("id", stored.id);
      if (updateError) console.error("Contact email status update failed:", updateError);
      return { success: true, emailSent: true };
    } catch (emailError) {
      console.error("Contact email delivery failed:", emailError);
      const nextAttempt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          email_status: "failed",
          email_attempts: 1,
          next_email_attempt_at: nextAttempt,
        })
        .eq("id", stored.id);
      if (updateError) console.error("Contact email failure status update failed:", updateError);
      return { success: true, emailSent: false };
    }
  } catch (error) {
    console.error("Contact message submission failed:", error);
    return {
      success: false,
      error: "Your message could not be saved. Please try again or email Haris directly.",
    };
  }
}
