import Script from "next/script";
import "../globals.css";

export const metadata = { robots: { index: false, follow: false } };

/** Entry pages for the Telegram Mini Apps (shop and admin). They hand over to the normal site pages. */
export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="bg-white text-slate-800">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
