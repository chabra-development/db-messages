import "dotenv/config";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const api = axios.create({ timeout: 30_000 });

const BLIP_URL = "https://chabra.http.msging.net/commands";
const DESK_KEY = process.env.BLIP_DESK_API_KEY!;
const ROUTER_KEY = process.env.ROUTER_API_KEY!;

async function fetchByTicket(blipTicketId: string, take = 5) {
  const res = await api.post(
    BLIP_URL,
    {
      id: randomUUID(),
      to: "postmaster@desk.msging.net",
      method: "get",
      uri: `/tickets/${blipTicketId}/messages?$take=${take}&$skip=0&$ascending=true&getFromOwnerIfTunnel=true`,
    },
    { headers: { Authorization: `Key ${DESK_KEY}` } },
  );
  return res.data.resource?.items ?? [];
}

async function fetchByThread(identity: string, take = 5) {
  const res = await api.post(
    BLIP_URL,
    {
      id: randomUUID(),
      method: "get",
      uri: `/threads/${identity}?$take=${take}&refreshExpiredMedia=true`,
    },
    { headers: { Authorization: `Key ${ROUTER_KEY}` } },
  );
  return res.data.resource?.items ?? [];
}

async function main() {
  // Pegar tickets não-tunnel
  const tickets = await prisma.ticket.findMany({
    take: 5,
    where: { customerIdentity: { not: { contains: "@tunnel.msging.net" } } },
    orderBy: { storageDate: "desc" },
    select: {
      id: true,
      blipId: true,
      sequentialId: true,
      customerIdentity: true,
      messageCount: true,
    },
  });

  console.log(`\n=== Tickets não-tunnel selecionados: ${tickets.length} ===\n`);

  for (const ticket of tickets) {
    console.log(
      `\n--- Ticket #${ticket.sequentialId} | messageCount=${ticket.messageCount} ---`,
    );
    console.log(`    customerIdentity: ${ticket.customerIdentity}`);

    // Buscar sample do ticket endpoint
    const ticketMsgs = await fetchByTicket(ticket.blipId, 3);
    console.log(`\n    [TICKET ENDPOINT] ${ticketMsgs.length} mensagens`);
    for (const m of ticketMsgs) {
      const resolvedId = m.metadata?.["#messageId"] ?? m.id;
      const inDb = await prisma.message.findUnique({
        where: { blipId: resolvedId },
        select: { id: true, ticketId: true },
      });
      console.log(`      message.id: ${m.id}`);
      console.log(
        `      #messageId: ${m.metadata?.["#messageId"] ?? "(ausente)"}`,
      );
      console.log(`      resolvedId: ${resolvedId}`);
      console.log(
        `      No banco:   ${inDb ? `✓ ticketId=${inDb.ticketId ?? "null"}` : "✗ não encontrado"}`,
      );
      console.log();
    }

    // Buscar sample do thread endpoint
    const threadMsgs = await fetchByThread(ticket.customerIdentity, 3);
    console.log(`    [THREAD ENDPOINT] ${threadMsgs.length} mensagens`);
    for (const m of threadMsgs) {
      const inDb = await prisma.message.findUnique({
        where: { blipId: m.id },
        select: { id: true, ticketId: true },
      });
      console.log(`      message.id: ${m.id}`);
      console.log(
        `      No banco:   ${inDb ? `✓ ticketId=${inDb.ticketId ?? "null"}` : "✗ não encontrado"}`,
      );
      console.log();
    }

    // Total no banco para esse ticket
    const dbCount = await prisma.message.count({
      where: { ticketId: ticket.id },
    });
    const dbCountNull = await prisma.message.count({
      where: { ticketId: { equals: null } },
    });
    console.log(`    Mensagens linkadas ao ticket no banco: ${dbCount}`);
    console.log(
      `    Mensagens sem ticketId no banco (amostra global): ${dbCountNull}`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
