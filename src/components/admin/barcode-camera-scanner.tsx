"use client";

// Kamera orqali shtrix-kod skaneri — ZERO dependency.
// BarcodeDetector API Chrome/Edge/Android WebView'da mavjud; qo'llab-
// quvvatlanmagan brauzerlarda (Safari/Firefox) tugma yashiriladi va
// foydalanuvchi qo'lda kiritish oqimidan foydalanaveradi.
//
// Ishlatish: <BarcodeCameraScanner onScan={(code) => ...} />

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type BarcodeFormat =
  | "ean_13"
  | "ean_8"
  | "upc_a"
  | "upc_e"
  | "code_128"
  | "code_39"
  | "itf";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: {
      formats?: BarcodeFormat[];
    }) => {
      detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
    };
  }
}

function noopSubscribe() {
  return () => {};
}

const SUPPORTED_FORMATS: BarcodeFormat[] = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
];

export function BarcodeCameraScanner({
  onScan,
}: {
  onScan: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Brauzer qo'llab-quvvatlamasa tugma umuman ko'rinmaydi.
  // useSyncExternalStore — SSR'da false, klientda haqiqiy qiymat (hydration-safe).
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia,
    () => false
  );

  const stop = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // orqa kamera (telefonda)
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new window.BarcodeDetector!({
        formats: SUPPORTED_FORMATS,
      });

      // 200ms da bir kadrni tekshiramiz — CPU yuklamaydi.
      let stopped = false;
      const tick = async () => {
        if (stopped) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) {
            stopped = true;
            setOpen(false);
            onScan(codes[0].rawValue.trim());
            return;
          }
        } catch {
          // Kadr hali tayyor emas — keyingi urinishda qayta tekshiramiz.
        }
        timerRef.current = setTimeout(tick, 200);
      };
      tick();
    } catch {
      setError("Kamera ochilmadi — ruxsatni tekshiring.");
      stop();
    }
  }, [onScan, stop]);

  // Komponent unmount bo'lganda kamerani yopamiz.
  useEffect(() => stop, [stop]);

  function toggle() {
    if (open) {
      setOpen(false);
      stop();
    } else {
      setOpen(true);
      void start();
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
          open
            ? "bg-rose-600 text-white hover:bg-rose-700"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
        aria-pressed={open}
      >
        {open ? "Skanerni yopish" : "📷 Kamera"}
      </button>

      {open && (
        <div className="relative overflow-hidden rounded-lg border border-slate-300">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-24 w-40 bg-slate-900 object-cover"
          />
          {/* Markazdagi skaner chizig'i */}
          <div className="pointer-events-none absolute inset-x-4 top-1/2 border-t-2 border-rose-500" />
          {error && (
            <p className="absolute inset-x-0 bottom-0 bg-rose-600/90 px-2 py-0.5 text-[10px] text-white">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
