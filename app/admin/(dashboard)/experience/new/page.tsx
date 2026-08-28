import { ExperienceForm } from "@/app/components/admin/ExperienceForm";

export default function NewExperiencePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Experience Entry</h1>
        <p className="text-sm text-ink-secondary">Add a new entry to the experience timeline.</p>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ExperienceForm />
      </div>
    </div>
  );
}
