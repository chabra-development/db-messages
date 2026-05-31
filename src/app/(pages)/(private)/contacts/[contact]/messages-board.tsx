import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { isUnknownContent } from "@/guards/lime-thread-messages.guards";
import { cn } from "@/lib/utils";
import { Message } from "@prisma/client";
import { MessageRenderer } from "./message-renderer";
import { SystemInfoDate } from "./system-info-date";

type MessagesBoardProps = {
  messages: Pick<
    Message,
    "id" | "direction" | "content" | "sentAt" | "status"
  >[];
};

export const MessagesBoard = ({ messages }: MessagesBoardProps) => {
  if (messages.length === 0) {
    return (
      <Card className="flex-1 h-full bg-transparent border-none">
        <CardContent className="size-full flex justify-center">
          <CardDescription className="text-xl">
            Esse contato ainda não possui uma conversa
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Bug 2026-05-31: antes era `throw new Error()` que crashava a conversa
  // inteira quando aparecia 1 msg de tipo não tratado (frequente em msgs
  // forwarded fwd:fwd: que o Blip às vezes envia com schema reduzido).
  // Agora: log discreto, MessageRenderer cuida do fallback render por msg.
  if (process.env.NODE_ENV !== "production") {
    const unknown = messages.filter(({ content }) => isUnknownContent(content));
    if (unknown.length > 0) {
      console.warn(
        `[messages-board] ${unknown.length} msg(s) com tipo não tratado:`,
        unknown.map(m => ({ id: m.id, content: m.content })),
      );
    }
  }

  return (
    <CardContent className="space-y-2 px-2">
      {messages.map((message, index, array) => (
        <div
          key={message.id}
          id={`message-${message.id}`}
          className={cn(
            "w-full max-w-full min-w-0 flex flex-col",
            message.direction === "SENT" ? "items-end" : "items-start",
          )}
        >
          <SystemInfoDate index={index} array={array} date={message.sentAt} />
          <MessageRenderer message={message} />
        </div>
      ))}
    </CardContent>
  );
};
