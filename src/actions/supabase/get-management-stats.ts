"use server";

export async function getManagementStats() {
  // Self-hosted MinIO não expõe uma "Management API" como o Supabase.
  // A página admin omite essa seção via `configured: false`.
  return { configured: false as const };
}

export type ManagementStats = Awaited<ReturnType<typeof getManagementStats>>;
