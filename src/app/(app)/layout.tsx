import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
