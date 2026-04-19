"use client";

import { ImportProgressToast } from "@/components/import-data-toast";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { Button } from "@/components/ui/button";
import { useImportTickets } from "@/hooks/use-import-tickets";
import { Download } from "lucide-react";
import { useState } from "react";

export function ImportTicketsButton() {
  const [jobId, setJobId] = useState<string | null>(null);
  const { importTickets, isPending } = useImportTickets();

  const handleImport = () => {
    importTickets(undefined, {
      onSuccess: (data) => {
        if (data.jobId) setJobId(data.jobId);
      },
    });
  };

  return (
    <>
      <Button
        onClick={handleImport}
        disabled={isPending}
        variant="outline"
        size="sm"
      >
        {isPending ? (
          <BrailleSpinner name="braille">Iniciando...</BrailleSpinner>
        ) : (
          <>
            <Download className="size-4" />
            Importar Tickets
          </>
        )}
      </Button>

      {jobId && (
        <ImportProgressToast
          message="tickets"
          jobId={jobId}
          onComplete={() => setJobId(null)}
        />
      )}
    </>
  );
}
