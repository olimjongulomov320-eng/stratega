const ESKIZ_BASE_URL = "https://notify.eskiz.uz/api";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getEskizToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  if (!email || !password) {
    throw new Error("ESKIZ_EMAIL yoki ESKIZ_PASSWORD sozlanmagan");
  }

  const res = await fetch(`${ESKIZ_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Eskiz login xatoligi: ${res.status}`);
  }

  const data = await res.json();
  const token = data?.data?.token;
  if (!token) {
    throw new Error("Eskiz javobida token topilmadi");
  }

  // Eskiz tokens are valid for 30 days; refresh daily to be safe.
  cachedToken = { value: token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  return token;
}

export type SendSmsResult = { ok: true } | { ok: false; error: string };

export function isSmsConfigured(): boolean {
  return Boolean(process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD);
}

export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  try {
    const token = await getEskizToken();

    const res = await fetch(`${ESKIZ_BASE_URL}/message/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mobile_phone: phone.replace(/^\+/, ""),
        message,
        from: "4546",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Eskiz SMS send failed:", res.status, text);
      return { ok: false, error: "SMS yuborilmadi. Birozdan so'ng qayta urinib ko'ring." };
    }

    return { ok: true };
  } catch (err) {
    console.error("Eskiz SMS error:", err);
    return { ok: false, error: "SMS xizmati vaqtincha ishlamayapti." };
  }
}
