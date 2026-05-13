import { env } from "@/env";
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: env.STORAGE_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY,
    secretAccessKey: env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET = env.STORAGE_BUCKET;
