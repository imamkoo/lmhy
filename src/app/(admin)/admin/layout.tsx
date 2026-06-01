import Link from "next/link";
import { getSession } from "@/lib/auth"; 
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  let user;

  if (token) {
    user = await verifySessionToken(token);
  }

  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar - Premium Dark Mode */}
      <aside className="w-full md:w-72 bg-indigo-950 flex flex-col relative z-20 text-indigo-50 shadow-2xl shadow-indigo-900/20">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-600/20 to-transparent pointer-events-none"></div>

        <div className="p-8 pb-6 flex items-center gap-3 relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/LMHY.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md" />
          <Link href="/admin" className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
            Command Center
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto relative z-10">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-indigo-200/80 group">
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">📊</span>
            Dashboard
          </Link>
          <div className="pt-4 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-indigo-400/50">
            Database
          </div>
          <Link href="/admin/leads" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-indigo-200/80 group">
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">👥</span>
            Leads & Results
          </Link>
          <Link href="/admin/archetypes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-indigo-200/80 group">
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">✨</span>
            Dynamic Archetypes
          </Link>
          
          <div className="pt-6 pb-2 px-4 text-xs font-semibold uppercase tracking-wider text-indigo-400/50">
            System
          </div>
          <Link href="/admin/config" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-indigo-200/80 group">
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">⚙️</span>
            Assessment Config
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all text-indigo-200/80 group">
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">📋</span>
            Instruments (Locked)
          </Link>
        </nav>

        <div className="p-6 relative z-10">
          <div className="bg-indigo-900/50 rounded-2xl p-4 border border-indigo-700/30 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Administrator</p>
                <p className="text-xs text-indigo-300 truncate">{user.email}</p>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/50 rounded-xl text-xs font-semibold text-indigo-200 transition-colors flex items-center justify-center gap-2">
                <span>🚪</span> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle top decoration */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 absolute top-0 left-0 z-50"></div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
