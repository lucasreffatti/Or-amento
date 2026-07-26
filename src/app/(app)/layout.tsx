import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar user={session} />
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
