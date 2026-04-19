import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import Link from "next/link";
import { ManagementStatsQuery } from "./management-stats-query";
import { StorageStatsQuery } from "./storage-stats-query";
import { SupabaseStatsQuery } from "./supabase-stats-query";

export const metadata: Metadata = {
  title: "Supabase | db-messages",
};

export default function SupabasePage() {
  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Supabase</CardTitle>
        <CardDescription className="text-base">
          Monitoramento de tabelas, storage e saúde do projeto
        </CardDescription>
        <CardAction>
          <Link
            href="https://supabase.com/dashboard/project/unmzkwhztyizitjletqg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Abrir dashboard ↗
          </Link>
        </CardAction>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0 h-[calc(100vh-10rem)]">
        <CardContent className="space-y-8">
          <Separator />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Projeto</h2>
            <ManagementStatsQuery />
          </section>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Banco de dados</h2>
            <SupabaseStatsQuery />
          </section>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Storage</h2>
            <StorageStatsQuery />
          </section>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
