"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/staff";

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
      } else {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-950 bg-[#0c1410] p-7 shadow-2xl space-y-5">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-900/40 text-[11px] text-amber-300">
        <span>🔒</span>
        <span>Restricted Access: Authorized Club Staff & Managers Only</span>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-900 bg-rose-950/50 p-3 text-xs text-rose-300 flex items-start gap-2">
          <span className="font-bold">✕</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <div>
          <label className="block text-gray-300 font-semibold mb-1.5">
            Staff Email or Phone
          </label>
          <input
            type="text"
            required
            placeholder="staff@cueclub.com or 9988776655"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="w-full bg-[#111c16] border border-emerald-950 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-gray-300 font-semibold mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#111c16] border border-emerald-950 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950 transition mt-2"
        >
          {loading ? "Authenticating..." : "Sign In to Operations Console"}
        </button>
      </form>

      <div className="pt-3 border-t border-gray-800 text-center">
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-amber-400 transition"
        >
          ← Back to Customer Website
        </Link>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-[#070b09] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-950">
              <span className="text-2xl font-black text-white">🎱</span>
            </div>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Cue<span className="text-amber-400">Club</span> Staff Portal
          </h2>
          <p className="text-xs text-gray-400">
            Secure operations console for table timing, billing, and reservations.
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-xs text-gray-400">Loading portal...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[11px] text-gray-600">
          CueClub Smart Snooker & Pool Management • All access attempts logged
        </p>
      </div>
    </div>
  );
}
