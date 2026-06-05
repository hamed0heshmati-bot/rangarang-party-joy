import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_install_dismissed_v1";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Already installed?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) return;

    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    if (isIos) {
      // iOS doesn't fire beforeinstallprompt — show manual instructions
      const t = setTimeout(() => {
        setShowIos(true);
        setVisible(true);
      }, 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-[100] md:left-auto md:right-4 md:max-w-sm">
      <div className="rounded-2xl border border-border/50 bg-card shadow-festive p-4 flex items-start gap-3">
        <img src="/icon-192.png" alt="رنگارنگ" className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">نصب اپ رنگارنگ</div>
          {showIos ? (
            <p className="text-xs text-muted-foreground mt-1 leading-5">
              برای نصب، روی دکمه <Share className="inline w-3.5 h-3.5 mx-0.5" /> اشتراک‌گذاری بزن و «Add to Home Screen» را انتخاب کن.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">برای دسترسی سریع‌تر، اپ رو روی گوشیت نصب کن.</p>
          )}
          {!showIos && (
            <button
              onClick={install}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-festive text-primary-foreground text-xs font-bold shadow-festive"
            >
              <Download className="w-3.5 h-3.5" /> نصب
            </button>
          )}
        </div>
        <button onClick={dismiss} aria-label="بستن" className="text-muted-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
