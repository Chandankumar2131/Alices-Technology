import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_40%),linear-gradient(135deg,#020617_0%,#0f172a_60%,#111827_100%)]">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
