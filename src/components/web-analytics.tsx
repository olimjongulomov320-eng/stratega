"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { YM_ID, GA_ID, YM_WEBVISOR, ANALYTICS_FROM_ENV, LIVE_HOST, trackGoal, trackPageView } from "@/lib/web-analytics";

const noSubscribe = () => () => {};
const isLiveAnalytics = () => ANALYTICS_FROM_ENV || LIVE_HOST.test(window.location.hostname);
const serverOff = () => false;

/** Loads Yandex Metrica / GA4 (when configured), sends page views and tracks contact-link clicks. */
export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);
  // Built-in counters run only on the live domain. The server renders nothing; the browser checks its host.
  const enabled = useSyncExternalStore(noSubscribe, isLiveAnalytics, serverOff);

  // Metrica page views for client-side navigation (GA4 tracks history changes by itself).
  // The first page is counted by Metrica's own init, so only later URLs are sent from here.
  useEffect(() => {
    if (!enabled || !YM_ID) return;
    const qs = searchParams.toString();
    const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
    if (lastUrl.current !== null && lastUrl.current !== url) trackPageView(url, lastUrl.current);
    lastUrl.current = url;
  }, [enabled, pathname, searchParams]);

  // Calls and messenger clicks anywhere on the site.
  useEffect(() => {
    if (!enabled || (!YM_ID && !GA_ID)) return;
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) trackGoal("phone_click");
      else if (/^https?:\/\/(t\.me|telegram\.me)\//.test(href)) trackGoal("telegram_click");
      else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) trackGoal("whatsapp_click");
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      {YM_ID && (
        <Script id="yandex-metrica" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:${YM_WEBVISOR}});`}
        </Script>
      )}
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${GA_ID}");`}
          </Script>
        </>
      )}
    </>
  );
}
