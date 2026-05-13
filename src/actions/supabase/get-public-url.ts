"use server";

import { BUCKET_NAME } from "@/constraints/bucket";
import { env } from "@/env";

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

export async function getPublicUrl(input: string): Promise<string> {
  const path = extractPath(input);

  const base = env.STORAGE_ENDPOINT.replace(/\/+$/, "");
  return `${base}/${BUCKET_NAME}/${path}`;
}
