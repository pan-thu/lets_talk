// src/app/(app)/layout.tsx
import { Sidebar } from "~/_components/layouts/Sidebar";
import { getServerAuthSession } from "~/server/auth";
import { redirect } from "next/navigation";
import MobileHeader from "~/_components/layouts/MobileHeader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="main-bg flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar - Hidden on small screens */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area Wrapper */}
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        {/* Mobile Header - Visible only on small screens */}
        <div className="block md:hidden">
          <MobileHeader />
        </div>

        {/* Scrollable main content - Adjust padding as needed */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}