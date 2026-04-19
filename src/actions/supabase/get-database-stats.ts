"use server";

import { prisma } from "@/lib/prisma";

export async function getDatabaseStats() {
  const [
    contacts,
    messages,
    tickets,
    tags,
    users,
    messagesByDirection,
    ticketsByStatus,
  ] = await prisma.$transaction([
    prisma.contact.count(),
    prisma.message.count(),
    prisma.ticket.count(),
    prisma.tag.count(),
    prisma.user.count(),
    prisma.message.groupBy({
      by: ["direction"],
      _count: { _all: true },
      orderBy: { direction: "asc" },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
  ]);

  return {
    counts: { contacts, messages, tickets, tags, users },
    messagesByDirection,
    ticketsByStatus,
  };
}

export type DatabaseStats = Awaited<ReturnType<typeof getDatabaseStats>>;
