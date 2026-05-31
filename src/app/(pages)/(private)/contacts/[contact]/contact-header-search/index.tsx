"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Images, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { MediaTabs } from "./media-tabs";
import { SearchTab } from "./search-tab";

export const ContactHeaderSearch = () => {
  const pathname = usePathname();
  const [, , contactId] = pathname.split("/");
  const [open, setOpen] = useState(false);
  const [, setHighlightedMessageId] = useQueryState("message-id", parseAsString);

  // Bug 2 (resolvido 2026-05-31): antes era scrollIntoView direto em msg-${id},
  // o que falhava silenciosamente quando a msg estava fora da janela paginada
  // do useMessages. Agora seta ?message-id=... via nuqs e deixa o
  // contacts-query.tsx tomar conta — ele auto-pagina até a msg aparecer no
  // DOM e então scrolla. nuqs evita o erro de typedRoutes do router.replace.
  function handleNavigate(messageId: string) {
    setOpen(false);
    setHighlightedMessageId(messageId);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={"ghost"}>
          <Search className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card pt-8">
        <Tabs defaultValue="search" className="size-full">
          <TabsList variant="line" className="w-full transition-all">
            <TabsTrigger value="search">
              <Search />
              Pesquisa
            </TabsTrigger>
            <TabsTrigger value="midias">
              <Images />
              Midias
            </TabsTrigger>
          </TabsList>
          <Separator className="-translate-y-2" />
          <TabsContent value="search">
            <SearchTab contactId={contactId} onNavigate={handleNavigate} />
          </TabsContent>
          <TabsContent
            value="midias"
            className="h-full flex flex-col justify-baseline pt-4"
          >
            <MediaTabs contactId={contactId} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
