import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  take: z.coerce.number().int().positive().optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
  search: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: z.prettifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { take, skip, search } = parsed.data;

  const tags = await prisma.tag.findMany({
    take,
    skip,
    where: search
      ? {
          name: { contains: search, mode: "insensitive" },
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags, { status: 200 });
}

const createTagSchema = z.object({
  tags: z.array(
    z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#?[0-9a-fA-F]+$/, "String não é um HEX válido"),
    }),
  ),
  createdById: z.uuid(),
});

export async function POST(req: NextRequest) {
  const { success, data, error } = createTagSchema.safeParse(await req.json());

  if (!success) {
    return NextResponse.json(error, { status: 400 });
  }

  const tagsCreated = await prisma.tag.createMany({
    data: data.tags.map(({ color, name }) => ({
      name,
      color,
      createdById: data.createdById,
    })),
  });

  return NextResponse.json(tagsCreated, { status: 201 });
}
