import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50 md:h-screen md:overflow-hidden">
      <Sidebar user={session} />
      <main className="flex-1 flex flex-col w-full min-w-0 md:h-full md:overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 text-neutral-900 flex-1">
          {children}
        </div>
      </main>
    </div>

  );
}
