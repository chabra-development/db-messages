"use server";

import { BUCKET_NAME } from "@/constraints/bucket";
import { s3 } from "@/lib/storage";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const FOLDER_TO_MIMETYPE: Record<string, string> = {
  images: "image",
  audios: "audio",
  videos: "video",
  documents: "application",
  archives: "application",
  others: "unknown",
};

export async function getStorageStats() {
  let totalSize = 0;
  let fileCount = 0;
  const byMimetype: Record<string, number> = {};

  let continuationToken: string | undefined;
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of resp.Contents ?? []) {
      fileCount++;
      totalSize += obj.Size ?? 0;
      const folder = obj.Key?.split("/")[0] ?? "others";
      const mt = FOLDER_TO_MIMETYPE[folder] ?? "unknown";
      byMimetype[mt] = (byMimetype[mt] ?? 0) + 1;
    }

    continuationToken = resp.IsTruncated
      ? resp.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return {
    buckets: [
      {
        id: BUCKET_NAME,
        name: BUCKET_NAME,
        public: true,
        type: "STANDARD",
        createdAt: new Date(0).toISOString(),
        fileCount,
        totalSize,
        byMimetype,
      },
    ],
  };
}

export type StorageStats = Awaited<ReturnType<typeof getStorageStats>>;
