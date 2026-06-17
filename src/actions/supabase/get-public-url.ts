"use server";

import { BUCKET_NAME } from "@/constraints/bucket";
import { s3Public } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function extractPath(input: string): string {
  if (input.startsWith("http")) {
    const marker = `${BUCKET_NAME}/`;

    const index = input.indexOf(marker);

    if (index === -1) {
      throw new Error("URL inválida — bucket não encontrado");
    }

    return input.slice(index + marker.length);
  }

  return input;
}

// SEC-01: antes retornava a URL pública crua, o que exigia `anonymous download`
// no bucket (PII de saúde acessível sem auth). Agora devolve uma pre-signed URL
// (TTL 10 min) assinada com `s3Public` (endpoint browser-facing), mantendo a
// mídia acessível ao browser e aos viewers externos SEM acesso anônimo.
// `extractPath` aceita tanto URL completa (URIs já gravadas em
// messages.content.uri) quanto key relativa — por isso não é preciso migrar o DB.
export async function getPublicUrl(input: string): Promise<string> {
  // Mídia legada/externa (ex.: blipmediastore, discord) não está no nosso bucket
  // e não pode ser assinada — devolve a URL como está (comportamento pré-SEC-01,
  // sem regredir mídia que já era externa).
  if (input.startsWith("http") && !input.includes(`${BUCKET_NAME}/`)) {
    return input;
  }

  const path = extractPath(input);

  return getSignedUrl(
    s3Public,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: path }),
    { expiresIn: 600 },
  );
}
