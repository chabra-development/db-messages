import "dotenv/config";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const api = axios.create({ timeout: 30_000 });

const BLIP_URL = "https://chabra.http.msging.net/commands";
const DESK_KEY = process.env.BLIP_DESK_API_KEY!;
const ROUTER_KEY = process.env.ROUTER_API_KEY!;

async function main() {
  // Ticket que já tem mensagens linkadas
  const ticket = await prisma.ticket.findFirst({
    where: { messageCount: { gt: 0 } },
    select: {
      id: true,
      blipId: true,
      sequentialId: true,
      customerIdentity: true,
      messageCount: true,
    },
  });
  console.log("Ticket:", ticket);

  // Mensagens linkadas no banco
  const linked = await prisma.message.findMany({
    where: { ticketId: ticket!.id },
    select: { blipId: true, type: true },
    take: 5,
  });
  console.log("\nMensagens no banco (linkadas):");
  linked.forEach((m) => console.log(`  blipId: ${m.blipId} | type: ${m.type}`));

  // Ticket endpoint
  const ticketRes = await api.post(
    BLIP_URL,
    {
      id: randomUUID(),
      to: "postmaster@desk.msging.net",
      method: "get",
      uri: `/tickets/${ticket!.blipId}/messages?$take=10&$skip=0&$ascending=true&getFromOwnerIfTunnel=true`,
    },
    { headers: { Authorization: `Key ${DESK_KEY}` } },
  );

  const ticketMsgs = ticketRes.data.resource?.items ?? [];
  console.log(`\n[TICKET ENDPOINT] ${ticketMsgs.length} mensagens:`);
  for (const m of ticketMsgs.slice(0, 5)) {
    const inDb = await prisma.message.findUnique({
      where: { blipId: m.id },
      select: { id: true },
    });
    console.log(`  message.id   = ${m.id}`);
    console.log(`  no banco:    ${inDb ? "✓" : "✗"}`);
    console.log();
  }

  // Thread endpoint
  const threadRes = await api.post(
    BLIP_URL,
    {
      id: randomUUID(),
      method: "get",
      uri: `/threads/${ticket!.customerIdentity}?$take=5&refreshExpiredMedia=true`,
    },
    { headers: { Authorization: `Key ${ROUTER_KEY}` } },
  );

  const threadMsgs = threadRes.data.resource?.items ?? [];
  console.log(`\n[THREAD ENDPOINT] ${threadMsgs.length} mensagens:`);
  for (const m of threadMsgs.slice(0, 5)) {
    const inDb = await prisma.message.findUnique({
      where: { blipId: m.id },
      select: { id: true },
    });
    console.log(`  message.id = ${m.id} | no banco: ${inDb ? "✓" : "✗"}`);
  }

  // Resumo: mensagens sem ticketId (amostra)
  const unlinked = await prisma.message.findMany({
    where: { ticketId: null },
    select: { blipId: true },
    take: 5,
    orderBy: { sentAt: "desc" },
  });
  console.log("\n[BANCO] Sample mensagens sem ticketId:");
  unlinked.forEach((m) => console.log(`  blipId: ${m.blipId}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
