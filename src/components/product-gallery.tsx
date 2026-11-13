"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";

type Labels = { open: string; close: string; previous: string; next: string };

/**
 * Product photos on the product page: a main photo, thumbnails that switch it, and a full-size viewer that opens in
 * the page (arrows, swipe and Esc), so extra photos no longer open as a separate image link.
 */
export function ProductGallery({ images, alt, badge, labels }: { images: string[]; alt: string; badge?: React.ReactNode; labels: Labels }) {
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const step = (d: number) => setCurrent((i) => (i + d + count) % count);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (!d.open) return;
      if (e.key === "ArrowRight") setCurrent((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setCurrent((i) => (i - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (count === 0) return null;
  const arrow = "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xl text-slate-700 shadow hover:bg-white";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={labels.open}
        className="relative flex aspect-square cursor-zoom-in items-center justify-center rounded-2xl bg-slate-50 p-10"
      >
        {badge}
        <ProductImage src={images[current]} alt={current === 0 ? alt : `${alt} — ${current + 1}`} sizes="(min-width: 1024px) 50vw, 100vw" eager={current === 0} />
      </button>

      {count > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 10).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`${alt} — ${i + 1}`}
              aria-pressed={i === current}
              className={`flex aspect-square items-center justify-center rounded-xl bg-slate-50 p-1.5 ring-2 transition ${i === current ? "ring-indigo-500" : "ring-transparent hover:ring-slate-300"}`}
            >
              <ProductImage src={src} alt="" sizes="96px" />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto h-[min(92vh,900px)] w-[min(96vw,1100px)] max-w-none rounded-2xl bg-white p-0 backdrop:bg-slate-900/80"
      >
        <div
          className="relative flex h-full w-full items-center justify-center p-6 sm:p-10"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <ProductImage src={images[current]} alt={`${alt} — ${current + 1}`} sizes="100vw" />
          <button type="button" onClick={() => dialog.current?.close()} aria-label={labels.close} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-lg text-slate-700 shadow hover:bg-white">
            ✕
          </button>
          {count > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label={labels.previous} className={`${arrow} left-3`}>
                ‹
              </button>
              <button type="button" onClick={() => step(1)} aria-label={labels.next} className={`${arrow} right-3`}>
                ›
              </button>
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-sm text-slate-600">
                {current + 1} / {count}
              </p>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
