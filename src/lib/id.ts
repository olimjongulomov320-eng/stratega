import { randomBytes } from "crypto";

// Prisma'dagi `cuid()` qiymati brauzer/serverda generatsiya qilinadi —
// ya'ni bazadagi "default" emas. Shuning uchun bizga raw SQL bilan qator
// yaratishda ham xuddi shu formatdagi id kerak bo'ladi.
//
// Format: c + timestamp(base36) + blok-sana(base36, 4 belgi) + tasodifiy(base36, 8 belgi)

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const COUNTER_LENGTH = 4;
const RANDOM_LENGTH = 8;

let counter = Math.floor(Math.random() * 36 ** COUNTER_LENGTH);

function randomBase36(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/**
 * Prisma `cuid()` bilan bir xil formatdagi noyob identifikator.
 * Bazadagi boshqa id'lar bilan bir xil ko'rinishi va bir xil uzunlikda.
 */
export function cuid(): string {
  const timestamp = Date.now().toString(36);
  counter = (counter + 1) % 36 ** COUNTER_LENGTH;
  const count = counter.toString(36).padStart(COUNTER_LENGTH, "0");
  return `c${timestamp}${count}${randomBase36(RANDOM_LENGTH)}`;
}
