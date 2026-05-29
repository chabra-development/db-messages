import { env } from "@/env";
import { S3Client } from "@aws-sdk/client-s3";

const credentials = {
  accessKeyId: env.STORAGE_ACCESS_KEY,
  secretAccessKey: env.STORAGE_SECRET_KEY,
};

// S3 client interno — usado para todas as operações reais (Put/Get/Delete/List).
// Endpoint via DNS Docker (não acessível do browser).
export const s3 = new S3Client({
  endpoint: env.STORAGE_ENDPOINT,
  region: "auto",
  credentials,
  forcePathStyle: true,
});

// S3 client público — usado APENAS para gerar pre-signed URLs que o browser vai
// consumir. Precisa do endpoint externo (Cloudflare → tunnel → minio) senão a URL
// assinada vem com host interno minio:9000 e não resolve no browser.
// Fallback pra `s3` se STORAGE_PUBLIC_URL não estiver setado (legacy behavior).
// Ver wiki/db-messages/bug-media-uri-host-interno.md.
export const s3Public = env.STORAGE_PUBLIC_URL
  ? new S3Client({
      endpoint: env.STORAGE_PUBLIC_URL,
      region: "auto",
      credentials,
      forcePathStyle: true,
    })
  : s3;

export const BUCKET = env.STORAGE_BUCKET;
