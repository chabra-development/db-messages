import "server-only";

import { env } from "@/env";
import { BUCKET_NAME } from "@/constraints/bucket";
import { s3 } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// STORAGE_PUBLIC_URL é a base browser-facing (ex: https://storage.chabra.com.br).
// Fallback pra STORAGE_ENDPOINT (S3 client) só pra retrocompat — em prod a public URL
// deve ser sempre setada explicitamente (caso contrário URIs gravadas no DB ficam com
// host interno minio:9000 e o browser não resolve). Ver wiki bug-media-uri-host-interno.
const STORAGE_BASE = (env.STORAGE_PUBLIC_URL ?? env.STORAGE_ENDPOINT).replace(/\/+$/, "");
const STORAGE_PREFIX = `${STORAGE_BASE}/${BUCKET_NAME}/`;

const MEDIA_TYPE_PATTERN =
  /^(image|audio|video)\/|^application\/(pdf|zip|x-rar|x-7z|gzip|msword|vnd\.ms-|vnd\.openxml|vnd\.oasis)/;

const FOLDER_MAP: Record<string, string> = {
  "image/jpeg": "images", "image/png": "images", "image/gif": "images", "image/webp": "images",
  "image/svg+xml": "images", "image/heic": "images",
  "audio/ogg": "audios", "audio/mpeg": "audios", "audio/mp4": "audios",
  "audio/aac": "audios", "audio/wav": "audios",
  "video/mp4": "videos", "video/ogg": "videos", "video/webm": "videos",
  "application/pdf": "documents", "application/msword": "documents",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "documents",
  "application/vnd.ms-excel": "documents",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "documents",
  "application/vnd.ms-powerpoint": "documents",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "documents",
  "application/zip": "archives", "application/x-zip-compressed": "archives",
  "application/x-rar-compressed": "archives",
  "application/x-7z-compressed": "archives", "application/gzip": "archives",
};

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
  "image/svg+xml": "svg", "image/heic": "heic",
  "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/wav": "wav",
  "video/mp4": "mp4", "video/ogg": "ogv", "video/webm": "webm",
  "application/pdf": "pdf", "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip", "application/x-zip-compressed": "zip",
  "application/x-rar-compressed": "rar", "application/x-7z-compressed": "7z",
  "application/gzip": "gz",
};

export function isBlipMediaType(type: unknown): type is string {
  return typeof type === "string" && MEDIA_TYPE_PATTERN.test(type);
}

function generateKey(contactId: string | null, type: string, msgId: string): string {
  const folder = FOLDER_MAP[type] ?? "others";
  const ext = EXT_MAP[type] ?? "bin";
  const cid = (contactId ?? "unknown").replace(/[^a-zA-Z0-9-]/g, "");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${folder}/${cid}_${ts}_${msgId.slice(0, 8)}.${ext}`;
}

// Se a URI já aponta pro MinIO, devolve ela mesma (idempotente).
// Senão: baixa o conteúdo, sobe pro MinIO, devolve nova URI estável.
// Em falha, throws — caller decide se mantém URI original.
export async function downloadAndStoreMedia(
  originalUri: string,
  contactId: string | null,
  type: string,
  msgId: string,
): Promise<string> {
  if (originalUri.startsWith(STORAGE_PREFIX)) return originalUri;

  const dl = await fetch(originalUri, {
    headers: { "User-Agent": "chabra-db-messages/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  if (!dl.ok) throw new Error(`download HTTP ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  if (buf.length === 0) throw new Error("empty body");

  const key = generateKey(contactId, type, msgId);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buf,
      ContentType: type,
      CacheControl: "public, max-age=31536000",
    }),
  );

  return `${STORAGE_PREFIX}${key}`;
}
