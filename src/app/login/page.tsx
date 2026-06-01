"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal masuk.");
      return;
    }
    const from = searchParams.get("from") || "/admin";
    router.push(from);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Email Address</label>
        <input
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50/50"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Password</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-slate-50/50"
        />
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:transform-none"
      >
        {loading ? "Memproses…" : "Sign In to Account"}
      </button>

      <div className="mt-6 text-center text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <p className="font-semibold mb-1 text-slate-700">🔐 Developer Login Info</p>
        <p>Email: <code className="font-mono bg-white px-1.5 py-0.5 rounded text-indigo-600">admin@lmhy.id</code></p>
        <p>Pass: <code className="font-mono bg-white px-1.5 py-0.5 rounded text-indigo-600">lmhyadmin2026</code></p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/40 blur-[120px]"></div>
        
        <div className="relative z-10 px-20 text-white max-w-2xl">
          <div className="mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/LMHY.png" alt="Let Me Hear You" className="w-16 h-16 rounded-xl shadow-2xl mb-6" />
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Welcome to the <br/><span className="text-indigo-300">Command Center.</span>
            </h1>
            <p className="text-lg text-indigo-100/80 leading-relaxed">
              Manage leads, dynamic archetypes, and mental health assessment configurations with a beautiful, unified dashboard experience.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-indigo-200/60">
            <span>Secure System</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Version 2.0</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        {/* Mobile background blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] lg:hidden"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 lg:hidden flex justify-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="/assets/LMHY.png" alt="Let Me Hear You" className="w-14 h-14 rounded-xl shadow-lg" />
          </div>
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500">Please enter your credentials to continue.</p>
          </div>
          
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-400 animate-pulse">Loading form...</div>}>
            <LoginForm />
          </Suspense>
          
        </div>
      </div>
    </div>
  );
}
