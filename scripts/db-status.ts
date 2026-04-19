import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [linked, unlinked, total] = await Promise.all([
    prisma.message.count({ where: { ticketId: { not: null } } }),
    prisma.message.count({ where: { ticketId: null } }),
    prisma.message.count(),
  ]);
  console.log("Vinculadas:", linked.toLocaleString("pt-BR"));
  console.log("Sem ticket:", unlinked.toLocaleString("pt-BR"));
  console.log("Total:     ", total.toLocaleString("pt-BR"));
  await prisma.$disconnect();
}

main();
