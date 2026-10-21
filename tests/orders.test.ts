// ORDER_TRANSITIONS state machine testlari.
// Ishga tushirish: npm test  (tsx --test tests/*.test.ts)
//
// orders.ts prisma clientni import qiladi, lekin test qilinayotgan
// funksiyalar (allowedOrderTransitions) pure — DB'ga ulanishmaydi.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { allowedOrderTransitions } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

// Schema enum'dagi BARCHA holatlar — yangi holat qo'shilsa test
// avtomatik yangi jadval talab qiladi.
const ALL_STATUSES: OrderStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

describe("allowedOrderTransitions", () => {
  test("har bir holat uchun jadval mavjud (undefined qaytmaydi)", () => {
    for (const status of ALL_STATUSES) {
      assert.ok(
        Array.isArray(allowedOrderTransitions(status)),
        `${status} uchun jadval yo'q`
      );
    }
  });

  test("terminal holatlardan chiqish mumkin emas", () => {
    assert.deepEqual(allowedOrderTransitions("COMPLETED"), []);
    assert.deepEqual(allowedOrderTransitions("CANCELLED"), []);
  });

  test("o'ziga o'ziga o'tish taqiqlangan", () => {
    for (const status of ALL_STATUSES) {
      assert.ok(
        !allowedOrderTransitions(status).includes(status),
        `${status} → ${status} o'tishi mumkin emas`
      );
    }
  });

  test("noma'lum holat uchun bo'sh ro'yxat (xavfsiz default)", () => {
    assert.deepEqual(allowedOrderTransitions("HACKED" as OrderStatus), []);
  });

  test("DRAFT faqat CONFIRMED yoki CANCELLED bo'ladi", () => {
    assert.deepEqual(
      allowedOrderTransitions("DRAFT").sort(),
      ["CANCELLED", "CONFIRMED"]
    );
  });

  test("SHIPPED faqat COMPLETED — ombordan chiqgan tovar qaytarilmaydi", () => {
    assert.deepEqual(allowedOrderTransitions("SHIPPED"), ["COMPLETED"]);
  });

  test("COMPLETED ga faqat SHIPPED dan o'tish mumkin", () => {
    for (const status of ALL_STATUSES) {
      if (status === "SHIPPED") continue;
      assert.ok(
        !allowedOrderTransitions(status).includes("COMPLETED"),
        `${status} → COMPLETED to'g'ridan-to'g'ri taqiqlanishi kerak`
      );
    }
  });

  test("joriy jadval bo'yicha graf yopiq: barcha maqsadlar enum'da", () => {
    for (const status of ALL_STATUSES) {
      for (const target of allowedOrderTransitions(status)) {
        assert.ok(
          ALL_STATUSES.includes(target),
          `${status} → ${target}: maqsad enum'da yo'q`
        );
      }
    }
  });

  test("barcha yopish holatlari (except terminal) kamida bitta chiqishga ega", () => {
    for (const status of ALL_STATUSES) {
      if (status === "COMPLETED" || status === "CANCELLED") continue;
      assert.ok(
        allowedOrderTransitions(status).length > 0,
        `${status} dan chiqish yo'li yo'q — buyurtma qulflanib qoladi`
      );
    }
  });

  test("bekor qilish (CANCELLED) har qanday ishlab turgan holatdan mumkin", () => {
    const working: OrderStatus[] = [
      "DRAFT",
      "CONFIRMED",
      "PROCESSING",
      "READY_TO_SHIP",
    ];
    for (const status of working) {
      assert.ok(
        allowedOrderTransitions(status).includes("CANCELLED"),
        `${status} → CANCELLED bo'lishi kerak`
      );
    }
  });
});
