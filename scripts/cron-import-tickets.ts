import "dotenv/config";
import axios, { AxiosError } from "axios";
import { PrismaClient, TicketStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

// ============================================
// SETUP
// ============================================

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const RETRY_DELAY_MS = 10_000;
const MAX_RETRIES = 3;
type RetryableConfig = NonNullable<AxiosError["config"]> & {
  _retryCount?: number;
};

const api = axios.create({ timeout: 30_000 });
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    if (!config) return Promise.reject(error);
    config._retryCount = config._retryCount ?? 0;
    if (error.response?.status === 429 && config._retryCount < MAX_RETRIES) {
      config._retryCount++;
      console.warn(
        `[BLiP] 429 — aguardando ${RETRY_DELAY_MS / 1000}s (retry ${config._retryCount}/${MAX_RETRIES})`,
      );
      await new Promise<void>((r) => setTimeout(r, RETRY_DELAY_MS));
      return api(config);
    }
    return Promise.reject(error);
  },
);

const BLIP_URL = "https://chabra.http.msging.net/commands";
const DESK_KEY = process.env.BLIP_DESK_API_KEY!;
const BATCH_SIZE = 100;
const DELAY_MS = 300;

// ============================================
// TIPOS
// ============================================

interface LimeTicket {
  id: string;
  sequentialId: number;
  ownerIdentity: string;
  customerIdentity: string;
  customerDomain: string;
  provider: string;
  status: string;
  storageDate: string;
  statusDate?: string;
  openDate?: string;
  closeDate?: string;
  firstResponseDate?: string;
  externalId?: string;
  agentIdentity?: string;
  rating: number;
  team: string;
  closed: boolean;
  closedBy?: string;
  parentSequentialId?: number;
  priority: number;
  isAutomaticDistribution?: boolean;
  distributionType?: string;
}

interface TicketsPageResponse {
  status: "success" | "failure" | string;
  resource: {
    total: number;
    items: LimeTicket[];
  };
}

// ============================================
// BLIP API
// ============================================

async function fetchTickets(skip: number, take: number): Promise<LimeTicket[]> {
  const res = await api.post<TicketsPageResponse>(
    BLIP_URL,
    {
      id: randomUUID(),
      method: "get",
      to: "postmaster@desk.msging.net",
      uri: `/tickets?$skip=${skip}&$take=${take}`,
    },
    {
      headers: { Authorization: `Key ${DESK_KEY}` },
    },
  );

  if (res.data.status !== "success") {
    throw new Error(
      `Falha ao buscar tickets (skip=${skip}): ${res.data.status}`,
    );
  }

  return res.data.resource.items;
}

// ============================================
// STATUS MAP
// ============================================

function mapStatus(status: string): TicketStatus {
  const normalized = status.toLowerCase().replace(/\s+/g, "");
  const map: Record<string, TicketStatus> = {
    waiting: TicketStatus.Waiting,
    assigned: TicketStatus.Waiting,
    open: TicketStatus.InAttendance,
    inattendance: TicketStatus.InAttendance,
    closedattendant: TicketStatus.ClosedAttendant,
    closedclient: TicketStatus.ClosedClient,
    closedsystem: TicketStatus.ClosedSystem,
    transferred: TicketStatus.Transferred,
  };
  return map[normalized] ?? TicketStatus.Waiting;
}

// ============================================
// PROCESS TICKET
// ============================================

async function processTicket(
  ticket: LimeTicket,
): Promise<"created" | "skipped"> {
  const exists = await prisma.ticket.findUnique({
    where: { blipId: ticket.id },
    select: { id: true },
  });

  if (exists) return "skipped";

  await prisma.ticket.create({
    data: {
      blipId: ticket.id,
      sequentialId: ticket.sequentialId,
      parentSequentialId: ticket.parentSequentialId ?? null,
      externalId: ticket.externalId ?? null,
      ownerIdentity: ticket.ownerIdentity,
      customerIdentity: ticket.customerIdentity,
      customerDomain: ticket.customerDomain,
      agentIdentity: ticket.agentIdentity ?? null,
      provider: ticket.provider,
      status: mapStatus(ticket.status),
      closed: ticket.closed,
      closedBy: ticket.closedBy ?? null,
      team: ticket.team,
      rating: ticket.rating,
      priority: ticket.priority,
      isAutomaticDistribution: ticket.isAutomaticDistribution ?? null,
      distributionType: ticket.distributionType ?? null,
      storageDate: new Date(ticket.storageDate),
      statusDate: new Date(ticket.statusDate ?? ticket.storageDate),
      openDate: ticket.openDate ? new Date(ticket.openDate) : null,
      closeDate: ticket.closeDate ? new Date(ticket.closeDate) : null,
      firstResponseDate: ticket.firstResponseDate
        ? new Date(ticket.firstResponseDate)
        : null,
    },
  });

  return "created";
}

// ============================================
// MAIN
// ============================================

async function saveImportLog(data: {
  total: number;
  succeeded: number;
  failed: number;
  duration: number;
}) {
  await prisma.importLog.create({
    data: { type: "TICKETS", ...data, payloadSize: 0 },
  });
}

async function main() {
  if (!DESK_KEY) throw new Error("BLIP_DESK_API_KEY não definida");

  const startedAt = Date.now();
  console.log(
    `\n=== IMPORTAÇÃO DE TICKETS — ${new Date().toLocaleString("pt-BR")} ===\n`,
  );

  let skip = 0;
  let hasMore = true;
  let created = 0;
  let skipped = 0;
  let failed = 0;
  let total = 0;

  while (hasMore) {
    const tickets = await fetchTickets(skip, BATCH_SIZE);

    if (tickets.length === 0) {
      hasMore = false;
      break;
    }

    total = skip + tickets.length;

    for (const ticket of tickets) {
      try {
        const result = await processTicket(ticket);
        result === "created" ? created++ : skipped++;
      } catch (err) {
        failed++;
        console.error(
          `\n  ERRO [#${ticket.sequentialId}]: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    skip += BATCH_SIZE;
    hasMore = tickets.length === BATCH_SIZE;

    process.stdout.write(
      `\r  Processados: ${skip} | criados=${created} pulados=${skipped} erros=${failed}`,
    );

    if (hasMore) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const durationMs = Date.now() - startedAt;
  console.log(`\n\n=== RESUMO (${(durationMs / 1000).toFixed(1)}s) ===`);
  console.log(`  Total BLiP:  ${total}`);
  console.log(`  Criados:     ${created}`);
  console.log(`  Já existiam: ${skipped}`);
  console.log(`  Erros:       ${failed}`);

  await saveImportLog({
    total,
    succeeded: created + skipped,
    failed,
    duration: durationMs,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
