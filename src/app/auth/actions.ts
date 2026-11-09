"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function signOut(formData: FormData) {
  await auth.signOut();
  redirect((formData.get("redirectTo") as string) || "/");
}
