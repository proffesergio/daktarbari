import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === process.env.ADMIN_TOKEN;
}

export function isValidAdminToken(token: string): boolean {
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}
