import { redirect } from "next/navigation";
import createSupabaseServerClient from "@/app/lib/supabase/server";
import { Sidebar } from "@/app/components/admin/Sidebar";

export const metadata = {
  title: "Admin Dashboard | Harisx404",
  description: "Manage portfolio content",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!user) {
    redirect("/admin/login");
  }
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) redirect("/");

  return (
    <div className="admin-dashboard flex min-h-screen w-full flex-col bg-bg-primary text-text-primary" style={{ minWidth: 0 }}>
      <Sidebar />
      <div className="admin-content flex w-full flex-col pt-14 sm:py-6" style={{ minWidth: 0 }}>
        <div className="grid flex-1 items-start gap-6 px-4 py-6 sm:px-8 sm:py-0 xl:px-10" style={{ minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
