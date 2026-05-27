"use client";

import { useParams, useRouter } from "next/navigation";
import { useDictionary } from "@/hooks/use-dictionary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useState } from "react";
import { serverChangePassword } from "@/actions/admin-auth";
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function ChangePasswordPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = useDictionary(locale);
  const isRtl = locale === "ar";
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  if (!dict?.dashboard) {
    return <div className="flex min-h-screen items-center justify-center p-4"><p className="text-muted-foreground">Loading...</p></div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (newPassword !== confirmPassword) {
      setResult({ ok: false, msg: isRtl ? "كلمة المرور الجديدة غير متطابقة" : "New passwords don't match" });
      return;
    }
    if (newPassword.length < 4) {
      setResult({ ok: false, msg: isRtl ? "كلمة المرور يجب أن تكون 4 أحرف على الأقل" : "Password must be at least 4 characters" });
      return;
    }

    setLoading(true);
    const res = await serverChangePassword(currentPassword, newPassword);
    if (res.success) {
      setResult({ ok: true, msg: isRtl ? "تم تغيير كلمة المرور بنجاح!" : "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setResult({ ok: false, msg: res.ar_error || res.error || "Error" });
    }
    setLoading(false);
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col lg:flex-row">
      <DashboardHeader locale={locale} dict={dict} />
      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-4"
            >
              <ArrowRight className={`h-3 w-3 ${isRtl ? "rotate-180" : ""}`} />
              {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
            </button>
            <h1 className="text-2xl font-bold tracking-tight">
              {isRtl ? "تغيير كلمة المرور" : "Change Password"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRtl ? "سيتم حفظ كلمة المرور الجديدة في قاعدة البيانات" : "The new password will be saved in the database"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                {isRtl ? "كلمة المرور الحالية" : "Current Password"}
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm outline-none focus:border-primary"
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                {isRtl ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm outline-none focus:border-primary"
                  required
                  minLength={4}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                {isRtl ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                required
                minLength={4}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {loading
                ? (isRtl ? "جاري التغيير..." : "Changing...")
                : (isRtl ? "تغيير كلمة المرور" : "Change Password")}
            </button>

            {result && (
              <div className={`flex items-start gap-2 rounded-xl p-4 text-sm ${
                result.ok ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}>
                {result.ok ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                <span>{result.msg}</span>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
