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
    <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row bg-[#F6F7F9] dark:bg-[#10131A] text-ink-primary">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full md:pl-64">
        {/* We can add a top header here if needed */}
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </div>
      </div>
    </div>
  );
}
