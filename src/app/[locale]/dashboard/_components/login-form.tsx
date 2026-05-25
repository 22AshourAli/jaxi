"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/hooks/use-dictionary";

export default function LoginForm() {
  const { locale } = useParams<{ locale: string }>();
  const dict = useDictionary(locale);
  const router = useRouter();
  const supabase = createClient();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendOTP() {
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setStep("otp");
    setMsg(dict.dashboard.otpSent.replace("{phone}", phone));
  }

  async function verifyOTP() {
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    router.push(`/${locale}/dashboard/${phone}`);
  }

  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{dict.dashboard.login}</h1>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder={dict.dashboard.phoneNumber}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              dir="ltr"
            />
            <button
              onClick={sendOTP}
              disabled={loading || !phone}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? dict.common.loading : dict.dashboard.sendOTP}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{msg}</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder={dict.dashboard.enterOTP}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-primary"
              dir="ltr"
              maxLength={6}
            />
            <button
              onClick={verifyOTP}
              disabled={loading || otp.length < 4}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? dict.common.loading : dict.dashboard.verifyOTP}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
