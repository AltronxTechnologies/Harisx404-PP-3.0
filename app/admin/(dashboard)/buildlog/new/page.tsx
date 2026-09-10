import { BuildlogForm } from "@/app/components/admin/BuildlogForm";

export default function NewBuildlogProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Buildlog project</h1>
        <p className="text-sm text-ink-secondary">Add a project and its ordered shipped or planned release items.</p>
      </div>
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-4 shadow-sm sm:p-6">
        <BuildlogForm />
      </div>
    </div>
  );
}
