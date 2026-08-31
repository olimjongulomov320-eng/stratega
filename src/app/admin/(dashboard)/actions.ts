"use server";

import { clearAdminSession } from "@/lib/admin-auth";
import { clearEmployeeSession } from "@/lib/employee-auth";

export async function adminLogout() {
  await clearAdminSession();
  await clearEmployeeSession();
}
