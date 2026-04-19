"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useHelpSearch } from "./use-help-search";

export function HelpClient({ isAdmin }: { isAdmin: boolean }) {
  const { search, setSearch, filteredSections } = useHelpSearch(isAdmin);

  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Central de Ajuda</CardTitle>
        <CardDescription className="text-base">
          Encontre instruções e tire dúvidas sobre as páginas do sistema
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por página ou dúvida..."
            className="pl-9 w-1/4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0 h-[calc(100vh-14rem)]">
        <CardContent className="space-y-4">
          {filteredSections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Nenhum resultado encontrado para &quot;{search}&quot;
            </p>
          ) : (
            filteredSections.map((section) => {
              const Icon = section.icon;

              return (
                <Card key={section.id} className="border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5 text-primary" />
                      <CardTitle className="text-base">
                        {section.title}
                      </CardTitle>
                      {section.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {section.badge}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="w-full">
                      {section.topics.map((topic, idx) => (
                        <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                          <AccordionTrigger className="text-sm font-normal">
                            {topic.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {topic.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
