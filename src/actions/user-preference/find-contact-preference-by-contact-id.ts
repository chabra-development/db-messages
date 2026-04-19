"use server";

import { getSessionOrRedirect } from "@/functions/get-session";
import { prisma } from "@/lib/prisma";

export async function findContactPreferenceByContactId(contactId: string) {
  const { user } = await getSessionOrRedirect();

  return prisma.contactUserPreference.findUnique({
    where: { contactId_userId: { contactId, userId: user.id } },
  });
}
