"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({ children, isLoggedIn }: { children: ReactNode; isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 shrink-0">
        <Link href="/" className="font-bold text-indigo-600 dark:text-indigo-400">
          Let Me Hear You
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
