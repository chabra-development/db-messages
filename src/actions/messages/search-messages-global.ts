"use server";

import { prisma } from "@/lib/prisma";
import { Message } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type GlobalMessageResult = Pick<
  Message,
  "id" | "direction" | "content" | "sentAt" | "status"
> & {
  contact: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    identity: string;
  };
};

type Params = {
  query: string;
  take?: number;
};

export async function searchMessagesGlobal({
  query,
  take = 20,
}: Params): Promise<GlobalMessageResult[]> {
  if (!query.trim()) return [];

  const term = `%${query.trim()}%`;

  type RawResult = Omit<GlobalMessageResult, "sentAt" | "contact"> & {
    sentAt: Date;
    contactId: string;
    contactName: string | null;
    contactPhoneNumber: string | null;
    contactIdentity: string;
  };

  const results = await prisma.$queryRaw<RawResult[]>`
        SELECT
            m.id,
            m.direction,
            m.content,
            m.sent_at AS "sentAt",
            m.status,
            c.id AS "contactId",
            c.name AS "contactName",
            c.phone_number AS "contactPhoneNumber",
            c.identity AS "contactIdentity"
        FROM messages m
        INNER JOIN contacts c ON c.id = m.contact_id
        WHERE m.content::text ILIKE ${term}
        ORDER BY m.sent_at DESC
        LIMIT ${take}
    `;

  return results.map(
    ({
      contactId,
      contactName,
      contactPhoneNumber,
      contactIdentity,
      ...msg
    }) => ({
      ...msg,
      contact: {
        id: contactId,
        name: contactName,
        phoneNumber: contactPhoneNumber,
        identity: contactIdentity,
      },
    }),
  );
}
