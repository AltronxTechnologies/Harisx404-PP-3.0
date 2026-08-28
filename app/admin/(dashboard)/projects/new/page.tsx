import { ProjectForm } from "@/app/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-sm text-ink-secondary">Add a new project to your portfolio.</p>
      </div>
      
      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <ProjectForm />
      </div>
    </div>
  );
}
