import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative" style={{ background: 'var(--bg)' }}>
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80" style={{ background: 'var(--bg)' }}>
        <Sidebar />
      </div>
      <main className="md:pl-72 pb-10 h-full min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        {children}
      </main>
    </div>
  );
}
