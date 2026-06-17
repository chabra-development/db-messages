"use server";

import { getPublicUrl } from "@/actions/supabase/get-public-url";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function findMessagesMediaByContactId(contactId: string) {
  const messages = await prisma.message.findMany({
    where: {
      contactId,
      AND: [
        { content: { not: Prisma.JsonNull } },
        { content: { path: ["uri"], not: Prisma.JsonNull } },
        { content: { path: ["type"], not: "sticker/webp" } },
      ],
    },
    orderBy: [{ sentAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      content: true,
      sentAt: true,
    },
  });

  // SEC-01: o bucket não é mais anônimo. Assina cada content.uri (pre-signed,
  // TTL 10 min) no servidor, para que o painel de mídia (accordion + dialog,
  // ambos alimentados por esta action) renderize e baixe sem acesso anônimo.
  // getPublicUrl devolve URLs externas (mídia legada) inalteradas; getFileName()
  // já remove o query string, então nome/label do arquivo seguem corretos.
  return Promise.all(
    messages.map(async (message) => {
      const content = message.content;

      if (
        content &&
        typeof content === "object" &&
        !Array.isArray(content) &&
        typeof (content as Record<string, unknown>).uri === "string"
      ) {
        const uri = (content as Record<string, unknown>).uri as string;

        return {
          ...message,
          content: {
            ...(content as Record<string, unknown>),
            uri: await getPublicUrl(uri),
          } as Prisma.JsonObject,
        };
      }

      return message;
    }),
  );
}
