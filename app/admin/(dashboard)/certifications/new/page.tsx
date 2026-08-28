import { CertificationForm } from "@/app/components/admin/CertificationForm";

export default function NewCertificationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Certification</h1>
        <p className="text-sm text-ink-secondary">Add a new certification to the about page.</p>
      </div>

      <div className="rounded-xl border border-border-hairline bg-surface-raised p-6 shadow-sm">
        <CertificationForm />
      </div>
    </div>
  );
}
