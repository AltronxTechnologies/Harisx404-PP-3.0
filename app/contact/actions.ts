"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import * as z from "zod";
import { checkRateLimit } from "@/app/lib/rate-limit";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

const projectTypes = [
  "full-time",
  "freelance",
  "contract",
  "web-development",
  "cybersecurity",
  "ai-ml",
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
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactResult =
  | { success: true; emailSent: boolean }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

const projectTypeLabels: Record<ContactInput["projectType"], string> = {
  "full-time": "Full-time role",
  freelance: "Freelance project",
  contract: "Contract engagement",
  "web-development": "Web development",
  cybersecurity: "Cybersecurity",
  "ai-ml": "AI / ML",
  consulting: "Technical consulting",
  collaboration: "Collaboration",
  other: "General inquiry",
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
  if (data.website) return { success: true, emailSent: true };

  try {
    const headerList = await headers();
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "unknown";
    const limit = checkRateLimit(`contact-submit:${ip}`, {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.success) {
      return { success: false, error: "Too many messages. Please try again in a few minutes." };
    }
  } catch {
    // Validation and the private service-role insert still protect submissions.
  }

  try {
    const supabase = await createSupabaseAdminClient();
    const { data: stored, error } = await supabase
      .from("contact_messages")
      .insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        project_type: data.projectType,
        message: data.message,
      })
      .select("id")
      .single();

    if (error || !stored) throw error || new Error("Message was not stored.");

    try {
      await sendOwnerEmail(data);
      await supabase
        .from("contact_messages")
        .update({ email_status: "sent", emailed_at: new Date().toISOString() })
        .eq("id", stored.id);
      return { success: true, emailSent: true };
    } catch (emailError) {
      console.error("Contact email delivery failed:", emailError);
      await supabase
        .from("contact_messages")
        .update({ email_status: "failed" })
        .eq("id", stored.id);
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
