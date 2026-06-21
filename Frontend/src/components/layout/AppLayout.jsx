import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[linear-gradient(135deg,#070b12_0%,#0d1422_52%,#101827_100%)] text-slate-100">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 md:p-6">
          <div className="mx-auto w-full max-w-[1500px] animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
