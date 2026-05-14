# scripts/ — utilitários standalone

Scripts auxiliares de migração e manutenção. Rodam em container Bun ad-hoc
na máquina `.107` (onde estão Postgres e MinIO), conectados à rede docker do
compose. Não rodam na Vercel.

## Scripts disponíveis

| Arquivo | Função |
|---|---|
| `dryrun-media.ts` | Conta + agrupa mídia pendente de migração (sem baixar nada). Quebra por tipo, host CDN, idade. |
| `migrate-media-v3.ts` | Re-fetch Blip API e migra mídia pro MinIO local. Fase A (tickets via DESK key) + Fase B (threads via ROUTER key). |

## Como rodar

Pré-requisitos na `.107`:
- Docker Desktop ativo
- Stack do compose (`postgres`, `minio`) up
- `.env` com `BLIP_DESK_API_KEY` e `ROUTER_API_KEY` setados

```powershell
cd C:\Users\CHABRA\Documents\db-messages-main

# Instala deps uma vez (gera scripts/node_modules)
docker run --rm `
  --network db-messages-main_db-messages-network `
  -v "${PWD}\scripts:/scripts" -w /scripts `
  oven/bun:1.2-alpine bun install --production

# DRY-RUN — não modifica nada
docker run --rm `
  --network db-messages-main_db-messages-network `
  --env-file .env `
  -v "${PWD}\scripts:/scripts" -w /scripts `
  -e DATABASE_URL="postgresql://chabra_admin:Chabra2026!Keven@postgres:5432/wpp_blip" `
  -e STORAGE_ENDPOINT=https://storage.chabra.com.br `
  oven/bun:1.2-alpine bun run dryrun-media.ts

# MIGRAÇÃO REAL — Fase A (tickets only) com concorrência 8
docker run --rm `
  --network db-messages-main_db-messages-network `
  --env-file .env `
  -v "${PWD}\scripts:/scripts" -w /scripts `
  -e DATABASE_URL="postgresql://chabra_admin:Chabra2026!Keven@postgres:5432/wpp_blip" `
  -e STORAGE_BUCKET=chabra-db-messages `
  -e STORAGE_ACCESS_KEY=<svcacct-access> `
  -e STORAGE_SECRET_KEY=<svcacct-secret> `
  -e STORAGE_ENDPOINT=https://storage.chabra.com.br `
  -e STORAGE_INTERNAL_ENDPOINT=http://minio:9000 `
  -e CONCURRENCY=8 -e SKIP_CONTACTS=1 `
  oven/bun:1.2-alpine bun run migrate-media-v3.ts
```

## Env vars (migrate-media-v3)

| Var | Default | Significado |
|---|---|---|
| `DATABASE_URL` | obrigatório | TCP direct ao Postgres (`postgres:5432` via docker network) |
| `STORAGE_*` | obrigatório | Credenciais MinIO (svcacct) |
| `STORAGE_INTERNAL_ENDPOINT` | `http://minio:9000` | Endpoint S3 dentro da rede docker (loopback, sem latência tunnel) |
| `BLIP_DESK_API_KEY` | obrigatório (via `--env-file`) | Pra `/tickets/{blipId}/messages` |
| `ROUTER_API_KEY` | obrigatório (via `--env-file`) | Pra `/threads/{identity}` |
| `CONCURRENCY` | 5 | Tickets/contatos em paralelo |
| `LIMIT_TICKETS` | — | Limita a N tickets (teste) |
| `LIMIT_CONTACTS` | — | Limita a N contatos (teste) |
| `SKIP_TICKETS` | `0` | `1` pula Fase A |
| `SKIP_CONTACTS` | `0` | `1` pula Fase B |
| `MAX_PAGES` | 100 | Limite anti-loop (10k msgs por escopo) |

## Notas de design

- **URIs do Blip são transitórias** — SAS tokens válidos por apenas 30 min após a chamada da API. Por isso o script re-chama a API pra cada ticket/thread antes de baixar.
- **Idempotência** — script pula mensagens cuja `content.uri` já aponta pra `STORAGE_ENDPOINT`. Múltiplos runs são seguros.
- **Resilience** — falhas (404, timeout) não interrompem; logam em `globalStats.errs` e seguem.
- **MinIO loopback** — uploads internos do container Bun pro container MinIO usam `http://minio:9000` (via rede docker), zero latência. URLs gerados no DB usam `STORAGE_ENDPOINT` público (tunnel CF) — porque é o que o browser do usuário vai resolver.

Ver detalhes completos em [`wiki/db-messages/migracao-media-blip-2026-05.md`](../) no repo `Chabra-llm`.
