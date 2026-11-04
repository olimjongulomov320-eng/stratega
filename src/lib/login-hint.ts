// What cached public pages may know about a login, in the browser. This cookie is not a credential: the session
// cookie stays HttpOnly and every server check uses it. The hint only says "worth asking the server for this
// visitor's prices", so guests make no extra request, and a wrong hint costs one empty answer.

export const SESSION_COOKIE = "stratega_session";
export const LOGIN_HINT_COOKIE = "stratega_logged_in";
export const LOGIN_HINT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const loginHintCookieOptions = () => ({
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

/** A new value per login, so an open page can tell that a different buyer logged in and drop the old prices. */
export const newLoginHint = () => crypto.randomUUID().slice(0, 8);
