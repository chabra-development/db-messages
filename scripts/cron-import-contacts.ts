import "dotenv/config";
import axios, { AxiosError } from "axios";
import { PrismaClient } from "@prisma/client";
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
const ROUTER_KEY = process.env.ROUTER_API_KEY!;
const TAKE = 100;
const BATCH_SIZE = 50;
const DELAY_MS = 500;

// ============================================
// TIPOS
// ============================================

interface LimeContact {
  identity: string;
  name: string;
  source: string;
  phoneNumber: string;
  email?: string;
  taxDocument?: string;
  group?: string;
  extras?: Record<string, string | undefined>;
  lastMessageDate?: string;
  lastUpdateDate?: string;
}

interface ContactsPageResponse {
  status: "success" | "failure" | string;
  resource: {
    total: number;
    items: LimeContact[];
  };
}

// ============================================
// BLIP API
// ============================================

async function fetchContactsPage(
  skip: number,
): Promise<{ total: number; items: LimeContact[] }> {
  const res = await api.post<ContactsPageResponse>(
    BLIP_URL,
    {
      id: randomUUID(),
      method: "get",
      uri: `/contacts?$skip=${skip}&$take=${TAKE}`,
    },
    {
      headers: { Authorization: `Key ${ROUTER_KEY}` },
    },
  );

  if (res.data.status !== "success") {
    throw new Error(
      `Falha ao buscar contatos (skip=${skip}): ${res.data.status}`,
    );
  }

  return { total: res.data.resource.total, items: res.data.resource.items };
}

async function fetchAllContacts(): Promise<LimeContact[]> {
  const first = await fetchContactsPage(0);
  const contacts: LimeContact[] = [...first.items];
  const pages = Math.ceil((first.total - TAKE) / TAKE);

  for (let i = 1; i <= pages; i++) {
    const { items } = await fetchContactsPage(i * TAKE);
    contacts.push(...items);
    await new Promise((r) => setTimeout(r, 300));
  }

  return contacts;
}

// ============================================
// UPSERT CONTATO
// ============================================

async function upsertContact(
  contact: LimeContact,
): Promise<"created" | "updated"> {
  const {
    identity,
    name,
    source,
    phoneNumber,
    email,
    taxDocument,
    group,
    extras,
    lastMessageDate,
    lastUpdateDate,
  } = contact;

  const existing = await prisma.contact.findUnique({
    where: { identity },
    select: { id: true },
  });

  await prisma.contact.upsert({
    where: { identity },
    create: {
      identity,
      name: name || "sem nome",
      source,
      phoneNumber,
      email,
      taxDocument,
      group,
      extras: extras ?? undefined,
      lastMessageDate: lastMessageDate ? new Date(lastMessageDate) : undefined,
      lastUpdateDate: lastUpdateDate ? new Date(lastUpdateDate) : undefined,
    },
    update: {
      name: name || "sem nome",
      source,
      phoneNumber,
      email,
      taxDocument,
      group,
      extras: extras ?? undefined,
      lastMessageDate: lastMessageDate ? new Date(lastMessageDate) : undefined,
      lastUpdateDate: lastUpdateDate ? new Date(lastUpdateDate) : undefined,
    },
  });

  return existing ? "updated" : "created";
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
    data: { type: "CONTACTS", ...data, payloadSize: 0 },
  });
}

async function main() {
  if (!ROUTER_KEY) throw new Error("ROUTER_API_KEY não definida");

  const startedAt = Date.now();
  console.log(
    `\n=== IMPORTAÇÃO DE CONTATOS — ${new Date().toLocaleString("pt-BR")} ===\n`,
  );

  const raw = await fetchAllContacts();
  const contacts = Array.from(
    new Map(raw.map((c) => [c.identity, c])).values(),
  );
  const deduped = raw.length - contacts.length;
  console.log(
    `Buscados: ${raw.length} | Únicos: ${contacts.length}${deduped > 0 ? ` | Duplicatas removidas: ${deduped}` : ""}`,
  );

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(upsertContact));

    for (const r of results) {
      if (r.status === "fulfilled") {
        r.value === "created" ? created++ : updated++;
      } else {
        failed++;
        console.error(
          `  ERRO: ${r.reason instanceof Error ? r.reason.message : r.reason}`,
        );
      }
    }

    const done = Math.min(i + BATCH_SIZE, contacts.length);
    process.stdout.write(
      `\r  ${done}/${contacts.length} (${((done / contacts.length) * 100).toFixed(1)}%) | criados=${created} atualizados=${updated} erros=${failed}`,
    );

    if (i + BATCH_SIZE < contacts.length)
      await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  const durationMs = Date.now() - startedAt;
  console.log(`\n\n=== RESUMO (${(durationMs / 1000).toFixed(1)}s) ===`);
  console.log(`  Criados:     ${created}`);
  console.log(`  Atualizados: ${updated}`);
  console.log(`  Erros:       ${failed}`);

  await saveImportLog({
    total: contacts.length,
    succeeded: created + updated,
    failed,
    duration: durationMs,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
