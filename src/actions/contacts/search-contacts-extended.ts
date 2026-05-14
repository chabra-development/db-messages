"use server";

import { prisma } from "@/lib/prisma";
import { Contact } from "@prisma/client";

const DEFAULT_TAKE = 30;

type Result = {
  data: Contact[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

// Busca contatos por nome, identity, telefone, email, CPF (tax_document)
// E TAMBÉM por conteúdo de qualquer mensagem vinculada (CPF/nome digitado
// no chat por RH/DP de terceiros, etc).
//
// Performance: EXISTS com ILIKE em content::text faz sequential scan em
// messages (~446k linhas). LIMIT 30 com early termination ajuda. Pra
// produção em alto volume, adicionar índice GIN com pg_trgm:
//   CREATE EXTENSION IF NOT EXISTS pg_trgm;
//   CREATE INDEX idx_messages_content_text_trgm
//     ON messages USING gin ((content::text) gin_trgm_ops);
export async function searchContactsExtended(
  query: string,
  take = DEFAULT_TAKE,
): Promise<Result> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { data: [], nextCursor: null, hasNextPage: false };
  }

  const term = `%${trimmed}%`;

  const data = await prisma.$queryRaw<Contact[]>`
    SELECT
      id,
      identity,
      name,
      source,
      phone_number       AS "phoneNumber",
      email,
      tax_document       AS "taxDocument",
      "group",
      extras,
      message_count      AS "messageCount",
      last_message_date  AS "lastMessageDate",
      last_update_date   AS "lastUpdateDate",
      created_at         AS "createdAt",
      updated_at         AS "updatedAt"
    FROM contacts c
    WHERE
         c.name          ILIKE ${term}
      OR c.identity      ILIKE ${term}
      OR c.phone_number  ILIKE ${term}
      OR c.email         ILIKE ${term}
      OR c.tax_document  ILIKE ${term}
      OR EXISTS (
        SELECT 1 FROM messages m
         WHERE m.contact_id = c.id
           AND m.content::text ILIKE ${term}
        LIMIT 1
      )
    ORDER BY last_message_date DESC NULLS LAST
    LIMIT ${take}
  `;

  return { data, nextCursor: null, hasNextPage: false };
}
