"use client";

import { CaledarRange } from "@/components/caledar-range";
import { SearchInput } from "@/components/seach-input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearchMessages } from "@/hooks/use-search-messages";
import { cn } from "@/lib/utils";
import { MessageContentPreview } from "@/components/message-content-preview";
import { formatDate } from "date-fns";
import { Calendar, Loader2, X } from "lucide-react";

export const SearchTab = ({
  contactId,
  onNavigate,
}: {
  contactId: string;
  onNavigate: (messageId: string) => void;
}) => {
  const {
    query,
    setQuery,
    data: messages,
    isLoading,
    debouncedQuery,
    dateRange,
    setDateRange,
  } = useSearchMessages(contactId);

  const showResults = !!debouncedQuery.trim();

  return (
    <div className="flex flex-col">
      <SheetHeader className="flex-row items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size={"icon"} variant={dateRange ? "default" : "outline"}>
              <Calendar />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="-translate-x-10 bg-card">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <CaledarRange value={dateRange} onChange={setDateRange} />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetTitle>Pesquisar mensagens</SheetTitle>
      </SheetHeader>

      <div className="px-4 flex flex-col gap-4">
        <SearchInput
          type="search"
          className="rounded-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar..."
        />
        {dateRange && (
          <Alert className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground my-4">
            <AlertTitle>
              {dateRange.from ? formatDate(dateRange.from, "dd/MM/yyyy") : "—"}
              {" → "}
              {dateRange.to ? formatDate(dateRange.to, "dd/MM/yyyy") : "—"}
            </AlertTitle>

            <button
              onClick={() => setDateRange(undefined)}
              className="ml-2 hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          </Alert>
        )}
      </div>

      {showResults && (
        <ScrollArea className="h-210 py-2">
          <div className="flex flex-col px-4 pt-4 gap-2">
            {isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && messages?.length === 0 && (
              <Card className="bg-transparent border-none shadow-none">
                <CardHeader>
                  <CardDescription className="text-base">
                    Nenhuma mensagem encontrada
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {!isLoading &&
              messages?.map((message) => (
                <div
                  key={message.id}
                  onClick={() => onNavigate(message.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm",
                    "bg-muted/50 hover:bg-muted cursor-pointer transition-colors",
                    message.direction === "SENT" ? "items-end" : "items-start",
                  )}
                >
                  <div className="w-full flex justify-between pb-4">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(message.sentAt, "dd/MM/yyyy")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(message.sentAt, "HH:mm")}
                    </span>
                  </div>
                  <MessageContentPreview
                    content={message.content}
                    className="line-clamp-2 wrap-break-word"
                  />
                </div>
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
