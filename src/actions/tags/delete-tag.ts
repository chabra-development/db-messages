"use server";

import { prisma } from "@/lib/prisma";
import { findTagById } from "./find-tag-by-id";

export async function deleteTag(id: string) {
  await findTagById(id);

  return await prisma.tag.delete({ where: { id } });
}
