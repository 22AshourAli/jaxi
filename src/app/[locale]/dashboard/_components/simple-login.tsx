"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { adminLogin } from "@/actions/admin-auth";

type Props = { locale: string };

export default function SimpleLogin({ locale }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRtl = locale === "ar";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError(locale === "ar" ? "كلمة المرور مطلوبة" : "Password is required");
      return;
    }
    setLoading(true);
    setError("");

    const res = await adminLogin(password);
    if (res.error) {
      setError(locale === "ar" ? "كلمة المرور خطأ" : "Wrong password");
      setLoading(false);
      return;
    }

    router.push(`/${locale}/dashboard`);
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 px-4"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_60%)] opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--accent)_0%,transparent_60%)] opacity-[0.05]" />

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {locale === "ar" ? "لوحة التحكم" : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? "أدخل كلمة المرور للدخول" : "Enter password to access"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium">
              {locale === "ar" ? "كلمة المرور" : "Password"}
            </label>
            <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-background px-4 py-3.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full bg-transparent text-sm outline-none"
                dir="ltr"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "ar" ? "جاري..." : "Loading..."}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
                <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${isRtl ? "rotate-180" : ""}`} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
