// Dry-run da migração de mídia Blip → MinIO.
// Roda standalone na .107, dentro de um container Bun ligado à rede do compose.
// Não baixa nem grava nada — só conta.
//
// Uso (na .107):
//   docker run --rm --network db-messages-main_db-messages-network \
//     -v "C:\Users\CHABRA\Documents\db-messages-main\scripts:/scripts:ro" \
//     -e DATABASE_URL="postgresql://chabra_admin:Chabra2026!Keven@postgres:5432/wpp_blip" \
//     -e STORAGE_ENDPOINT="https://storage.chabra.com.br" \
//     oven/bun:1.2 bun run /scripts/dryrun-media.ts

import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT ?? "https://storage.chabra.com.br";

if (!DATABASE_URL) {
  console.error("DATABASE_URL não setada");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

function pad(s: string, n: number) {
  return (s + " ".repeat(n)).slice(0, n);
}

console.log("\n========== DRY-RUN: análise de mídia em messages ==========");
console.log(`DB:               ${DATABASE_URL.replace(/:[^:]+@/, ":***@")}`);
console.log(`STORAGE_ENDPOINT: ${STORAGE_ENDPOINT}`);

// 1. Totais
const total = await client.query<{ count: string }>(
  "SELECT COUNT(*)::text AS count FROM messages",
);
const totalContent = await client.query<{ count: string }>(`
  SELECT COUNT(*)::text AS count FROM messages
  WHERE jsonb_typeof(content) = 'object'
`);
console.log(`\n[1] Totais`);
console.log(`  Total messages:           ${total.rows[0].count}`);
console.log(`  Com content JSON object:  ${totalContent.rows[0].count}`);

// 2. Distribuição por tipo de content
console.log("\n[2] Top 20 tipos em content->>'type'");
const byType = await client.query<{ type: string; count: string }>(`
  SELECT content->>'type' AS type, COUNT(*)::text AS count
  FROM messages
  WHERE jsonb_typeof(content) = 'object' AND content ? 'type'
  GROUP BY 1
  ORDER BY COUNT(*) DESC
  LIMIT 20
`);
for (const r of byType.rows) {
  console.log(`  ${pad(r.type ?? "(null)", 60)} ${r.count.padStart(10)}`);
}

// 3. Mídia: image/*, audio/*, video/*, application/* (excluindo lime application/vnd.*)
const MEDIA_REGEX = "^(image|audio|video)/|^application/(pdf|zip|x-rar|x-7z|gzip|msword|vnd\\.ms-|vnd\\.openxml|vnd\\.oasis)";
console.log(`\n[3] Mensagens com mídia (regex: ${MEDIA_REGEX})`);
const mediaByType = await client.query<{ type: string; count: string }>(`
  SELECT content->>'type' AS type, COUNT(*)::text AS count
  FROM messages
  WHERE content->>'type' ~ $1
  GROUP BY 1
  ORDER BY COUNT(*) DESC
`, [MEDIA_REGEX]);
let totalMedia = 0;
for (const r of mediaByType.rows) {
  totalMedia += Number(r.count);
  console.log(`  ${pad(r.type, 50)} ${r.count.padStart(10)}`);
}
console.log(`  ${pad("TOTAL", 50)} ${String(totalMedia).padStart(10)}`);

// 4. Já migrados (URI já aponta pro MinIO)
const alreadyMigrated = await client.query<{ count: string }>(`
  SELECT COUNT(*)::text AS count FROM messages
  WHERE content->>'uri' LIKE $1
`, [`${STORAGE_ENDPOINT}/%`]);
console.log(`\n[4] Já migrados pra MinIO (URI starts with ${STORAGE_ENDPOINT}):`);
console.log(`  ${alreadyMigrated.rows[0].count}`);

// 5. Pendentes (mídia que NÃO está no MinIO)
const pending = await client.query<{ count: string }>(`
  SELECT COUNT(*)::text AS count FROM messages
  WHERE content->>'type' ~ $1
    AND content->>'uri' IS NOT NULL
    AND content->>'uri' NOT LIKE $2
`, [MEDIA_REGEX, `${STORAGE_ENDPOINT}/%`]);
console.log(`\n[5] PENDENTES de migração:`);
console.log(`  ${pending.rows[0].count}`);

// 6. Amostra de URIs por tipo
console.log("\n[6] Amostra de 3 URIs por tipo (pra inspeção do host CDN Blip)");
for (const r of mediaByType.rows.slice(0, 8)) {
  const sample = await client.query<{ uri: string }>(`
    SELECT content->>'uri' AS uri
    FROM messages
    WHERE content->>'type' = $1
      AND content->>'uri' IS NOT NULL
      AND content->>'uri' NOT LIKE $2
    ORDER BY sent_at DESC
    LIMIT 3
  `, [r.type, `${STORAGE_ENDPOINT}/%`]);
  console.log(`\n  --- ${r.type} (${r.count} total) ---`);
  for (const s of sample.rows) {
    const truncated = s.uri.length > 120 ? s.uri.slice(0, 120) + "..." : s.uri;
    console.log(`    ${truncated}`);
  }
}

// 7. Hostnames únicos
console.log("\n[7] Hostnames únicos das URIs Blip (top 10)");
const hosts = await client.query<{ host: string; count: string }>(`
  SELECT
    substring(content->>'uri' FROM 'https?://([^/]+)') AS host,
    COUNT(*)::text AS count
  FROM messages
  WHERE content->>'type' ~ $1
    AND content->>'uri' IS NOT NULL
    AND content->>'uri' NOT LIKE $2
  GROUP BY 1
  ORDER BY COUNT(*) DESC
  LIMIT 10
`, [MEDIA_REGEX, `${STORAGE_ENDPOINT}/%`]);
for (const r of hosts.rows) {
  console.log(`  ${pad(r.host ?? "(null)", 50)} ${r.count.padStart(10)}`);
}

// 8. Distribuição por data (pra estimar quanto já passou da janela 90d Blip)
console.log("\n[8] Distribuição temporal das mensagens com mídia pendente");
const byAge = await client.query<{ bucket: string; count: string }>(`
  SELECT
    CASE
      WHEN sent_at > NOW() - INTERVAL '30 days'   THEN '0-30 dias'
      WHEN sent_at > NOW() - INTERVAL '60 days'   THEN '30-60 dias'
      WHEN sent_at > NOW() - INTERVAL '90 days'   THEN '60-90 dias (Blip ainda preserva)'
      WHEN sent_at > NOW() - INTERVAL '180 days'  THEN '90-180 dias (Blip pode ter apagado)'
      ELSE '>180 dias (Blip provavelmente apagou)'
    END AS bucket,
    COUNT(*)::text AS count
  FROM messages
  WHERE content->>'type' ~ $1
    AND content->>'uri' IS NOT NULL
    AND content->>'uri' NOT LIKE $2
  GROUP BY 1
  ORDER BY MIN(sent_at) DESC
`, [MEDIA_REGEX, `${STORAGE_ENDPOINT}/%`]);
for (const r of byAge.rows) {
  console.log(`  ${pad(r.bucket, 50)} ${r.count.padStart(10)}`);
}

await client.end();
console.log("\n========== DRY-RUN concluído ==========\n");
