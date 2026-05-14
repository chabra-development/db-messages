import { stringToHTML } from "@/functions/string-to-HTML";
import { Prisma } from "@prisma/client";
import type { ComponentProps } from "react";

function getContentPreview(content: Prisma.JsonValue): string {
  if (typeof content === "string") return content;

  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;

    if (
      obj.replied &&
      typeof (obj.replied as Record<string, unknown>).value === "string"
    )
      return (obj.replied as Record<string, unknown>).value as string;

    if (
      obj.body &&
      typeof (obj.body as Record<string, unknown>).text === "string"
    )
      return (obj.body as Record<string, unknown>).text as string;

    if (typeof obj.text === "string") return obj.text;

    if (typeof obj.type === "string" && obj.uri) return `[${obj.type}]`;

    if (obj.sequentialId) return `[Ticket #${obj.sequentialId}]`;

    if (obj.emoji) return "[Reação]";
  }

  return "[Mensagem]";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Highlight estilo WhatsApp — destaca todas ocorrências do termo (case-insensitive)
// e centraliza o preview ao redor da primeira match quando o texto é longo.
function highlightAroundFirstMatch(text: string, term: string): string {
  const escaped = escapeHtml(text);
  if (!term.trim()) return escaped;

  const escTerm = escapeHtml(term.trim());
  const idx = escaped.toLowerCase().indexOf(escTerm.toLowerCase());

  let snippet = escaped;
  if (idx >= 0 && escaped.length > 140) {
    const start = Math.max(0, idx - 40);
    const end = Math.min(escaped.length, idx + escTerm.length + 100);
    snippet = (start > 0 ? "…" : "") + escaped.slice(start, end) + (end < escaped.length ? "…" : "");
  }

  const re = new RegExp(`(${escapeRegex(escTerm)})`, "gi");
  return snippet.replace(re, '<mark class="bg-primary/30 text-foreground rounded px-0.5">$1</mark>');
}

type Props = Omit<ComponentProps<"div">, "children" | "content"> & {
  content: Prisma.JsonValue;
  highlight?: string;
};

export function MessageContentPreview({ content, highlight, ...props }: Props) {
  const raw = getContentPreview(content);
  if (highlight && highlight.trim()) {
    return stringToHTML(highlightAroundFirstMatch(raw, highlight), props);
  }
  return stringToHTML(raw, props);
}
