"use server";

import { BUCKET_NAME } from "@/constraints/bucket";
import { s3 } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function extractPath(input: string): string {
  // Se for URL completa, extrai o path após o bucket name
  if (input.startsWith("http")) {
    const marker = `${BUCKET_NAME}/`;
    const index = input.indexOf(marker);
    if (index === -1) throw new Error("URL inválida — bucket não encontrado");
    return input.slice(index + marker.length);
  }
  // Se já for path relativo, retorna direto
  return input;
}

export async function getDownloadUrl(input: string) {
  const path = extractPath(input);

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: path }),
    { expiresIn: 60 },
  );

  return {
    url,
    fileName: path.split("/").at(-1) ?? "arquivo",
  };
}
