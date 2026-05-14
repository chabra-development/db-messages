"use client";

import { MessageContentPreview } from "@/components/message-content-preview";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { GlobalMessageResult } from "@/actions/messages/search-messages-global";
import { formatDate } from "date-fns";
import { MessageSquareText } from "lucide-react";
import { AsideEmptyState } from "./aside-empty-state";
import { MessageSearchSkeleton } from "./aside-search-skeleton";

type Props = {
  messageResults: GlobalMessageResult[];
  isSearchingMessages: boolean;
  activeContactId: string | null;
  debouncedSearch: string;
  onSelectMessage: (message: GlobalMessageResult) => void;
  hideEmptyState?: boolean;
};

export function AsideMessageResults({
  messageResults,
  isSearchingMessages,
  activeContactId,
  debouncedSearch,
  onSelectMessage,
  hideEmptyState = false,
}: Props) {
  return (
    <>
      <CardHeader className="pt-0">
        <CardTitle className="text-2xl flex items-center gap-2">
          <MessageSquareText className="size-6" />
          Mensagens
          {!isSearchingMessages && (
            <Badge variant="secondary" className="h-fit">
              {messageResults.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <Separator />

      {isSearchingMessages ? (
        <MessageSearchSkeleton />
      ) : messageResults.length === 0 ? (
        hideEmptyState ? null : (
          <CardContent className="px-2 pt-4 pb-6">
            <AsideEmptyState searchQuery={debouncedSearch} />
          </CardContent>
        )
      ) : (
        <CardContent className="px-2 pt-4 pb-6">
          <div className="space-y-2">
            {messageResults.map((message, index) => (
              <div
                key={message.id}
                onClick={() => onSelectMessage(message)}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2",
                  "flex flex-col gap-1 rounded-lg px-3 py-2.5 text-sm cursor-pointer",
                  "bg-muted/50 hover:bg-muted transition-colors",
                  activeContactId === message.contact.identity &&
                    "bg-muted border border-border",
                )}
                style={{
                  animationDelay: `${Math.min(index * 30, 300)}ms`,
                  animationDuration: "300ms",
                  animationFillMode: "both",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {message.contact.name ?? message.contact.identity}
                  </span>
                  <span className="text-muted-foreground text-xs shrink-0 ml-2">
                    {formatDate(message.sentAt, "dd/MM/yy")}
                  </span>
                </div>
                <MessageContentPreview
                  content={message.content}
                  highlight={debouncedSearch}
                  className="text-muted-foreground text-xs line-clamp-2 wrap-break-word"
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </>
  );
}
