"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, TicketStatus } from "@prisma/client";

export type FindManyTicketsProps = {
  take: number;
  skip: number;
  search?: string | null;
  status?: TicketStatus | "all";
  team?: string | null;
};

export async function findManyTickets({
  take,
  skip,
  search,
  status,
  team,
}: FindManyTicketsProps) {
  const where: Prisma.TicketWhereInput = {
    ...(search
      ? {
          OR: [
            { customerIdentity: { contains: search, mode: "insensitive" } },
            { agentIdentity: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status && status !== "all" ? { status } : {}),
    ...(team ? { team } : {}),
  };

  const [tickets, count] = await Promise.all([
    prisma.ticket.findMany({
      take,
      skip,
      where,
      orderBy: { openDate: "desc" },
      select: {
        id: true,
        blipId: true,
        sequentialId: true,
        status: true,
        team: true,
        customerIdentity: true,
        agentIdentity: true,
        openDate: true,
        closeDate: true,
        messageCount: true,
        closed: true,
        closedBy: true,
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.ceil(count / take);

  return {
    data: tickets,
    count,
    page,
    totalPages,
  };
}
