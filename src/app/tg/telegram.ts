export type TgWebApp = {
  initData: string;
  initDataUnsafe?: { user?: { language_code?: string } };
  ready: () => void;
  expand: () => void;
};

/** The Telegram Mini App object, or null when the page is opened outside Telegram. */
export function telegramWebApp(): TgWebApp | null {
  const w = window as Window & { Telegram?: { WebApp?: TgWebApp } };
  const app = w.Telegram?.WebApp;
  return app && app.initData ? app : null;
}
