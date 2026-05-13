import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { StorageStatsQuery } from "./storage-stats-query";
import { SupabaseStatsQuery } from "./supabase-stats-query";

export const metadata: Metadata = {
  title: "Storage | db-messages",
};

export default function SupabasePage() {
  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Storage</CardTitle>
        <CardDescription className="text-base">
          Banco de dados (Postgres .107) e arquivos (MinIO .107)
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0 h-[calc(100vh-10rem)]">
        <CardContent className="space-y-8">
          <Separator />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Banco de dados</h2>
            <SupabaseStatsQuery />
          </section>
          <Separator />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Arquivos (MinIO)</h2>
            <StorageStatsQuery />
          </section>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
