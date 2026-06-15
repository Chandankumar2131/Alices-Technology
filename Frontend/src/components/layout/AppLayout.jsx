import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_40%),linear-gradient(135deg,#020617_0%,#0f172a_60%,#111827_100%)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
