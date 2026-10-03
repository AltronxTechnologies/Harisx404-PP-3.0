"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";

type AboutContent = {
  hero_title: string;
  hero_subtitle: string;
  section1_title: string;
  section1_content: string;
  section1_image_url: string;
  section2_title: string;
  section2_content: string;
  section2_image_url: string;
  section3_title: string;
  section3_content: string;
  section3_image_url: string;
  section4_title: string;
  section4_content: string;
  section4_image_url: string;
};

export default function AdminAboutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { register, handleSubmit, reset } = useForm<AboutContent>();

  useEffect(() => {
    fetch("/api/admin/about")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load About content");
        return res.json();
      })
      .then((data) => {
        reset(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadFailed(true);
        setMessage({ type: "error", text: "Failed to load about content." });
        setIsLoading(false);
      });
  }, [reset]);

  const onSubmit = async (data: AboutContent) => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      
      setMessage({ type: "success", text: "About page content saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium text-text-primary">About content unavailable</h1>
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">About content could not be loaded. No changes have been made.</p>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center rounded-full border border-border-primary px-5 text-sm font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">Retry loading</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight text-text-primary">Legacy About content</h1>
      </div>

      <p role="note" className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
        This editor saves legacy About content, but the locked public About page does not read it. Changes here will not appear on the public page.
      </p>

      {message.text && (
        <div role={message.type === "error" ? "alert" : "status"} className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-2xl border border-border-primary bg-white p-6 dark:bg-white/[0.03] space-y-4">
          <h2 className="text-lg font-medium text-text-primary">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="about-hero-title" className="mb-2 block text-sm font-medium">Hero Title</label>
              <input
                id="about-hero-title"
                {...register("hero_title")}
                className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
            </div>
            <div>
              <label htmlFor="about-hero-subtitle" className="mb-2 block text-sm font-medium">Hero Subtitle</label>
              <textarea
                id="about-hero-subtitle"
                {...register("hero_subtitle")}
                rows={3}
                className="w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Sections Map */}
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="rounded-2xl border border-border-primary bg-white p-6 dark:bg-white/[0.03] space-y-4">
            <h2 className="text-lg font-medium text-text-primary">Section {num}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor={`about-section-${num}-title`} className="mb-2 block text-sm font-medium">Section Title</label>
                <input
                  id={`about-section-${num}-title`}
                  {...register(`section${num}_title` as keyof AboutContent)}
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
              <div>
                <label htmlFor={`about-section-${num}-content`} className="mb-2 block text-sm font-medium">Content / Text</label>
                <textarea
                  id={`about-section-${num}-content`}
                  {...register(`section${num}_content` as keyof AboutContent)}
                  rows={4}
                  className="w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
              <div>
                <label htmlFor={`about-section-${num}-image`} className="mb-2 block text-sm font-medium">Image URL</label>
                <input
                  id={`about-section-${num}-image`}
                  {...register(`section${num}_image_url` as keyof AboutContent)}
                  placeholder="https://res.cloudinary.com/..."
                  className="min-h-11 w-full rounded-xl border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-text-primary px-6 py-2 text-sm font-medium text-bg-primary transition-colors hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
