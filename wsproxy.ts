// wsproxy.ts — TCP-over-WebSocket bridge para @neondatabase/serverless
// Usa net.createConnection (síncrono — sem race condition entre open() e message())

import { createConnection, type Socket } from "net";

const ALLOWED_HOST = process.env.ALLOWED_HOST || "postgres";
const ALLOWED_PORT = Number(process.env.ALLOWED_PORT) || 5432;
const LISTEN_PORT  = Number(process.env.LISTEN_PORT) || 8080;

type ConnData = { host: string; port: number; tcp: Socket | null };

Bun.serve<ConnData, {}>({
  port: LISTEN_PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(`wsproxy ok -> ${ALLOWED_HOST}:${ALLOWED_PORT}\n`, { status: 200 });
    }
    const m = url.pathname.match(/^\/([^:\/]+):(\d+)\/?$/);
    if (!m) {
      return new Response(`Bad path '${url.pathname}'. Expected /<host>:<port>\n`, { status: 400 });
    }
    const host = m[1]!;
    const port = Number(m[2]);
    if (host !== ALLOWED_HOST || port !== ALLOWED_PORT) {
      return new Response(`host:port '${host}:${port}' not in allowlist (only ${ALLOWED_HOST}:${ALLOWED_PORT})\n`, { status: 403 });
    }
    if (server.upgrade(req, { data: { host, port, tcp: null } })) return;
    return new Response("WebSocket upgrade required\n", { status: 426 });
  },
  websocket: {
    open(ws) {
      const { host, port } = ws.data;
      console.log(`[ws] open ${host}:${port}`);
      const tcp = createConnection({ host, port });
      tcp.setNoDelay(true);
      tcp.on("connect", () => {
        console.log(`[tcp] connected ${host}:${port}`);
      });
      tcp.on("data", (chunk: Buffer) => {
        try {
          ws.sendBinary(chunk);
        } catch (e: any) {
          console.error("[ws] send error:", e?.message);
        }
      });
      tcp.on("close", (hadError: boolean) => {
        console.log(`[tcp] close had_error=${hadError}`);
        try { ws.close(); } catch {}
      });
      tcp.on("error", (err: Error) => {
        console.error(`[tcp] error:`, err.message);
        try { ws.close(1011, err.message); } catch {}
      });
      ws.data.tcp = tcp;
    },
    message(ws, message) {
      const tcp = ws.data.tcp;
      if (!tcp) {
        console.log("[ws] message before tcp ready (shouldn't happen with createConnection)");
        return;
      }
      try {
        if (typeof message === "string") {
          tcp.write(message);
        } else {
          tcp.write(message as Buffer);
        }
      } catch (e: any) {
        console.error("[ws] forward error:", e?.message);
      }
    },
    close(ws) {
      console.log(`[ws] close`);
      try { ws.data.tcp?.destroy(); } catch {}
    },
  },
});

console.log(`wsproxy listening on :${LISTEN_PORT}, forwarding to ${ALLOWED_HOST}:${ALLOWED_PORT}`);
