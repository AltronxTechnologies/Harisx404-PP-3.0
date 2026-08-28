import { ChangelogForm } from "@/app/components/admin/ChangelogForm";

export default function NewChangelogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Changelog</h1>
        <p className="text-sm text-ink-secondary">Add a new entry to your changelog.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ChangelogForm />
      </div>
    </div>
  );
}
