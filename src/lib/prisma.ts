export const runtime = "nodejs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool as PgPool } from "pg";
import { neonConfig } from "@neondatabase/serverless";

// Quando DATABASE_WS_PROXY está setada (e.g. "db.chabra.com.br"), conecta via WebSocket
// pelo wsproxy self-hosted que repassa pra Postgres TCP. Sem essa env, usa TCP direto
// via `pg` (compatível com Supabase pooler).
const wsProxy = process.env.DATABASE_WS_PROXY;

function makeAdapter() {
  const url = process.env.DATABASE_URL;
  if (wsProxy) {
    neonConfig.wsProxy = (host, port) => `${wsProxy}/${host}:${port}`;
    neonConfig.useSecureWebSocket = true;
    neonConfig.pipelineConnect = false;
    neonConfig.pipelineTLS = false;
    return new PrismaNeon({ connectionString: url });
  }
  return new PrismaPg(new PgPool({ connectionString: url }));
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: makeAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
