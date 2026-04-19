"use server";

import { supabase } from "@/lib/supabase";

async function listAllFiles(
  bucket: string,
  prefix: string,
): Promise<{ size: number; mimetype: string; path: string }[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error || !data) return [];

  const results: { size: number; mimetype: string; path: string }[] = [];

  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      const nested = await listAllFiles(bucket, fullPath);
      results.push(...nested);
    } else {
      results.push({
        size: item.metadata?.size ?? 0,
        mimetype: item.metadata?.mimetype ?? "unknown",
        path: fullPath,
      });
    }
  }

  return results;
}

export async function getStorageStats() {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error || !buckets) return { buckets: [] };

  const bucketsWithStats = await Promise.all(
    buckets.map(async (bucket) => {
      const files = await listAllFiles(bucket.name, "");

      const totalSize = files.reduce((acc, f) => acc + f.size, 0);

      const byMimetype = files.reduce<Record<string, number>>((acc, f) => {
        const type = f.mimetype.split("/")[0];
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      }, {});

      return {
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        type: bucket.type,
        createdAt: bucket.created_at,
        fileCount: files.length,
        totalSize,
        byMimetype,
      };
    }),
  );

  return { buckets: bucketsWithStats };
}

export type StorageStats = Awaited<ReturnType<typeof getStorageStats>>;
