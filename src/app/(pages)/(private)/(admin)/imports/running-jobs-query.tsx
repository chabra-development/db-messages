"use client";

import { findRunningImportJobs } from "@/actions/import-jobs/find-running-import-jobs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2 } from "lucide-react";

function fmtElapsed(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtEta(elapsedMs: number, processed: number, total: number): string {
  if (processed === 0 || elapsedMs === 0) return "—";
  const rate = processed / (elapsedMs / 1000);
  const remaining = Math.max(0, total - processed);
  const etaSec = remaining / Math.max(rate, 0.001);
  return fmtElapsed(etaSec * 1000);
}

export function RunningJobsQuery() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["running-import-jobs"],
    queryFn: findRunningImportJobs,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhum import em andamento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const meta = (job.metadata ?? {}) as Record<string, unknown>;
        const type = (meta.type as string) ?? "import";
        const description = (meta.description as string) ?? type;
        const created = Number(meta.created ?? 0);
        const linked = Number(meta.linked ?? 0);
        const mediaOk = Number(meta.mediaOk ?? 0);
        const mediaFail = Number(meta.mediaFail ?? 0);

        const elapsedMs = job.startedAt
          ? Date.now() - new Date(job.startedAt).getTime()
          : 0;
        const pct = job.total > 0 ? Math.min(100, (job.processed / job.total) * 100) : 0;

        return (
          <Card key={job.id} className="border-primary/30">
            <CardContent className="space-y-2 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary animate-pulse" />
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>⏱ {fmtElapsed(elapsedMs)}</span>
                  <span>ETA {fmtEta(elapsedMs, job.processed, job.total)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{job.processed.toLocaleString("pt-BR")}</strong>
                    {" / "}
                    {job.total.toLocaleString("pt-BR")} tickets
                  </span>
                  <span className="font-mono">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground">Msgs criadas: </span>
                  <strong className="text-green-600">{created.toLocaleString("pt-BR")}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Relinked: </span>
                  <strong>{linked.toLocaleString("pt-BR")}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Mídia OK: </span>
                  <strong className="text-teal-600">{mediaOk.toLocaleString("pt-BR")}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Mídia fail: </span>
                  <strong className={mediaFail > 0 ? "text-destructive" : ""}>
                    {mediaFail.toLocaleString("pt-BR")}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
