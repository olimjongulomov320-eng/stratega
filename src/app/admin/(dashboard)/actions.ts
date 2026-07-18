"use server";

import { clearAdminSession } from "@/lib/admin-auth";

export async function adminLogout() {
  await clearAdminSession();
}
