"use server";

import { generateNameFile } from "@/actions/supabase/generate-file-name";
import { BUCKET_NAME } from "@/constraints/bucket";
import { s3 } from "@/lib/storage";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getPublicUrl } from "./get-public-url";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "video/mp4",
  "video/ogg",
  "video/webm",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/gzip",
];

function validateFile(file: File): void {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Máximo permitido: 50MB`);
  }
}

export async function deleteFile(filename: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: filename }),
  );
}

export async function updateFile(file: File, contactId: string) {
  validateFile(file);

  const filename = generateNameFile({
    contactId,
    type: file.type,
  });

  const body = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: body,
      ContentType: file.type,
      CacheControl: "no-cache",
    }),
  );

  return { path: filename };
}

export async function uploadFile(file: File, messageId: string) {
  const { path } = await updateFile(file, messageId);

  return getPublicUrl(path);
}
