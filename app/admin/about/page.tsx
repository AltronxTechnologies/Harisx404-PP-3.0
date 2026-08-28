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
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { register, handleSubmit, reset } = useForm<AboutContent>();

  useEffect(() => {
    fetch("/api/admin/about")
      .then((res) => res.json())
      .then((data) => {
        reset(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight text-ink-primary">About Page CMS</h1>
      </div>

      {message.text && (
        <div className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/30" : "bg-red-50 text-red-500 dark:bg-red-950/30"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-2xl border border-border-hairline bg-surface-raised p-6 space-y-4">
          <h2 className="text-lg font-medium text-ink-primary">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Hero Title</label>
              <input
                {...register("hero_title")}
                className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Hero Subtitle</label>
              <textarea
                {...register("hero_subtitle")}
                rows={3}
                className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
              />
            </div>
          </div>
        </div>

        {/* Sections Map */}
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="rounded-2xl border border-border-hairline bg-surface-raised p-6 space-y-4">
            <h2 className="text-lg font-medium text-ink-primary">Section {num}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Section Title</label>
                <input
                  {...register(`section${num}_title` as keyof AboutContent)}
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Content / Text</label>
                <textarea
                  {...register(`section${num}_content` as keyof AboutContent)}
                  rows={4}
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Image URL</label>
                <input
                  {...register(`section${num}_image_url` as keyof AboutContent)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full rounded-xl border border-border-hairline bg-surface-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-signal"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-accent-signal px-6 py-2 text-sm font-medium text-white shadow hover:bg-accent-signal/90 focus:outline-none disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
