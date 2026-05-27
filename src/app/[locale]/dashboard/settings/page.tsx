"use client";

import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useDictionary } from "@/hooks/use-dictionary";
import { QRCodeSVG } from "qrcode.react";
import { Download, Scissors, RefreshCw, CheckCircle, AlertCircle, Plus, Trash2, Eye, EyeOff, GripVertical, Loader2, Edit3, X, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { serverSyncServiceTimes, serverGetServices, serverAddService, serverUpdateService, serverDeleteService } from "@/actions/queue";

export default function SettingsPage() {
  const { locale } = useParams<{ locale: string }>();
  const dict = useDictionary(locale);
  const isRtl = locale === "ar";
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    const { data } = await serverGetServices();
    setServices(data);
    setLoadingServices(false);
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  if (!dict?.dashboard) {
    return <div className="flex min-h-screen items-center justify-center p-4"><p className="text-muted-foreground">{dict?.common?.loading ?? "Loading..."}</p></div>;
  }

  const joinUrl = `${siteUrl}/${locale}/join`;

  function downloadQR(format: "png" | "svg") {
    const canvas = document.querySelector("canvas");
    if (format === "png" && canvas) {
      const link = document.createElement("a");
      link.download = "qrcode-dawrk.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      const svg = document.querySelector(".qr-code-svg svg");
      if (svg) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        const blob = new Blob([svgStr], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "qrcode-dawrk.svg";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    const { errors } = await serverSyncServiceTimes();
    if (errors) {
      setSyncResult({ ok: false, msg: errors });
    } else {
      setSyncResult({ ok: true, msg: isRtl ? "تم تحديث أوقات الخدمات بنجاح!" : "Service times updated!" });
    }
    setSyncing(false);
    loadServices();
  }

  async function handleToggleActive(service: any) {
    await serverUpdateService(service.id, { is_active: !service.is_active });
    loadServices();
  }

  function startEdit(service: any) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditDuration(String(service.duration_minutes));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDuration("");
  }

  async function saveEdit(service: any) {
    if (!editName.trim() || !editDuration.trim()) return;
    await serverUpdateService(service.id, {
      name: editName.trim(),
      duration_minutes: parseInt(editDuration, 10),
    });
    setEditingId(null);
    loadServices();
  }

  async function handleAdd() {
    if (!newName.trim() || !newDuration.trim()) return;
    const dur = parseInt(newDuration, 10);
    if (isNaN(dur) || dur < 1) return;
    const { error: err } = await serverAddService(newName.trim(), dur);
    if (err) { setError(err); return; }
    setNewName("");
    setNewDuration("");
    setAdding(false);
    setError("");
    loadServices();
  }

  async function handleDelete(id: string) {
    if (!confirm(isRtl ? "حذف هذه الخدمة؟" : "Delete this service?")) return;
    await serverDeleteService(id);
    loadServices();
  }

  const activeServices = services.filter((s) => s.is_active);
  const inactiveServices = services.filter((s) => !s.is_active);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen flex-col lg:flex-row">
      <DashboardHeader locale={locale} dict={dict} />
      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">{dict.dashboard.settings}</h1>

          <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Scissors className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-lg font-semibold">{isRtl ? "QR Code الطابور" : "Queue QR Code"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRtl
                  ? "اطبع هذا الرمز وضعه على الحائط ليدخل الزبائن"
                  : "Print this QR code and place it on the wall for customers"}
              </p>
            </div>
            <div className="my-8 flex justify-center">
              <div className="qr-code-svg rounded-2xl border-4 border-primary/20 bg-white p-6 shadow-xl">
                <QRCodeSVG value={joinUrl} size={200} level="H" includeMargin />
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => downloadQR("png")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                <Download className="h-4 w-4" />
                {isRtl ? "تحميل PNG" : "Download PNG"}
              </button>
              <button onClick={() => downloadQR("svg")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-muted">
                <Download className="h-4 w-4" />
                {isRtl ? "تحميل SVG" : "Download SVG"}
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {isRtl ? "الرابط:" : "URL:"} {joinUrl}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold">
                  {isRtl ? "إدارة الخدمات" : "Service Management"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRtl ? "أضف أو عدل أو إخفاء الخدمات" : "Add, edit, or hide services"}
                </p>
              </div>
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {isRtl ? "إضافة" : "Add"}
              </button>
            </div>

            {loadingServices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {isRtl ? "لا توجد خدمات" : "No services"}
              </p>
            ) : (
              <div className="space-y-1">
                {activeServices.map((svc) => (
                  <div key={svc.id} className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition hover:border-primary/20">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    {editingId === svc.id ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 min-w-0 rounded-md border border-border bg-muted px-2 py-1 text-sm outline-none focus:border-primary"
                          dir={isRtl ? "rtl" : "ltr"}
                          autoFocus
                        />
                        <input
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value.replace(/\D/g, ""))}
                          className="w-16 rounded-md border border-border bg-muted px-2 py-1 text-sm text-center outline-none focus:border-primary"
                          dir="ltr"
                        />
                        <button onClick={() => saveEdit(svc)} className="shrink-0 rounded-md p-1.5 text-success hover:bg-success/10 transition">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 min-w-0 truncate text-sm font-medium">{svc.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full" dir="ltr">
                          {svc.duration_minutes} {isRtl ? "د" : "min"}
                        </span>
                        <button onClick={() => startEdit(svc)} className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleToggleActive(svc)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition" title={isRtl ? "إخفاء" : "Hide"}>
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(svc.id)} className="shrink-0 rounded-md p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {inactiveServices.map((svc) => (
                  <div key={svc.id} className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/30 px-3 py-2.5 opacity-60">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/20" />
                    <span className="flex-1 min-w-0 truncate text-sm text-muted-foreground line-through">{svc.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full">{svc.duration_minutes} min</span>
                    <button onClick={() => handleToggleActive(svc)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition" title={isRtl ? "إظهار" : "Show"}>
                      <EyeOff className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(svc.id)} className="shrink-0 rounded-md p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {adding && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  {isRtl ? "إضافة خدمة جديدة" : "Add New Service"}
                </p>
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isRtl ? "اسم الخدمة" : "Service name"}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    dir={isRtl ? "rtl" : "ltr"}
                    autoFocus
                  />
                  <input
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value.replace(/\D/g, ""))}
                    placeholder={isRtl ? "دقائق" : "Minutes"}
                    className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-sm text-center outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={!newName.trim() || !newDuration.trim()} className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                    {isRtl ? "إضافة" : "Add"}
                  </button>
                  <button onClick={() => { setAdding(false); setNewName(""); setNewDuration(""); setError(""); }} className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted">
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-1">
              {isRtl ? "مزامنة التوقيتات" : "Sync Times"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {isRtl
                ? "إذا غيرت التوقيتات يدوياً في قاعدة البيانات، اضغط الزر لمزامنتها مع النظام"
                : "If you changed times manually in the DB, click to sync with the system"}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing
                ? (isRtl ? "جاري التحديث..." : "Syncing...")
                : (isRtl ? "مزامنة التوقيتات الافتراضية" : "Sync Default Times")}
            </button>
            {syncResult && (
              <div className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs ${
                syncResult.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
                {syncResult.ok ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{syncResult.msg}</span>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
