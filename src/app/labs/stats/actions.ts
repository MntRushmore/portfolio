"use server";

import { cookies, headers } from "next/headers";
import { allowHit, ipKey, keyMatches, newStatsToken, STATS_COOKIE } from "@/lib/analytics";

export type LoginState = { error?: string };

/** Checks the key and, if it's right, leaves a signed cookie that opens /stats for 30 days. */
export async function unlockStats(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!allowHit(`login:${ipKey(ip)}`, 5, 40)) return { error: "Too many tries. Wait a moment." };

  const given = formData.get("key");
  if (typeof given !== "string" || given.length > 200 || !keyMatches(given.trim())) {
    return { error: "That key isn’t right." };
  }

  const token = newStatsToken();
  (await cookies()).set(STATS_COOKIE, token.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: token.maxAge,
  });
  return {};
}

export async function lockStats() {
  (await cookies()).delete(STATS_COOKIE);
}
