"use server";

import {
  isLimeMediaContent,
  isLimeReplyToMedia,
} from "@/guards/lime-thread-messages.guards";
import { LimeThreadMessage } from "@/types/lime-thread-messages-response.types";

export async function processMessageContent(
  message: LimeThreadMessage,
): Promise<{
  content: LimeThreadMessage["content"];
  metadata?: LimeThreadMessage["metadata"];
}> {
  // Caso 1: content é mídia direta — { type, uri }
  // Mantém a URI original do BLiP sem upload para o Supabase
  if (isLimeMediaContent(message.content)) {
    return {
      content: message.content,
      metadata: message.metadata,
    };
  }

  // Caso 2: content é reply com mídia no inReplyTo — { replied, inReplyTo: { value: { type, uri } } }
  // Mantém a URI original do BLiP sem upload para o Supabase
  if (isLimeReplyToMedia(message.content)) {
    return {
      content: message.content,
      metadata: message.metadata,
    };
  }

  // Demais tipos — retorna content original sem modificação
  return {
    content: message.content,
    metadata: message.metadata,
  };
}
