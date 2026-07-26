import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-neutral-50">
      <Sidebar user={session} />
      <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
