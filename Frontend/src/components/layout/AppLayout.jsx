import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex h-dvh overflow-hidden text-slate-100">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 md:p-6">
          <div className="motion-page mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
