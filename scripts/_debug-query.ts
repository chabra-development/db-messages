import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const tickets = await prisma.ticket.findMany({
    take: 5,
    skip: 100,
    select: { id: true, blipId: true, sequentialId: true, storageDate: true },
    orderBy: { storageDate: "asc" },
  });
  console.log(`Tickets retornados: ${tickets.length}`);
  tickets.forEach((t) =>
    console.log(`  #${t.sequentialId} storageDate=${t.storageDate}`),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
