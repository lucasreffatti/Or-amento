import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] md:h-screen overflow-hidden bg-neutral-50">
      <Sidebar user={session} />
      <main className="flex-1 flex flex-col w-full min-w-0 min-h-0 overflow-y-auto overscroll-y-contain overflow-x-hidden">
        <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 text-neutral-900">
          {children}
        </div>
      </main>
    </div>

  );
}
