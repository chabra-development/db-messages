"use client";

import { Card, CardDescription } from "@/components/ui/card";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { cn } from "@/lib/utils";
import { MessageDirection } from "@prisma/client";
import { formatDate } from "date-fns";
import dynamic from "next/dynamic";

const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), {
  ssr: true,
});

export const ContactMediaVideo = ({
  direction,
  date,
  uri,
}: {
  direction: MessageDirection;
  date: Date;
  uri: string;
}) => {
  const isSent = direction === MessageDirection.SENT;

  // SEC-01: pre-signed URL no render (bucket não é mais anônimo).
  const { data: signedUrl } = useSignedUrl(uri);

  return (
    <Card
      className={cn(
        "w-fit max-w-md p-1.5 gap-0 overflow-hidden relative",
        isSent
          ? "bg-message rounded-tr-none"
          : "dark:bg-muted bg-zinc-100 rounded-tl-none",
      )}
    >
      {signedUrl ? (
        <Plyr
          source={{
            type: "video",
            sources: [
              {
                src: signedUrl,
                type: "video/mp4",
                size: 1080,
              },
            ],
          }}
          options={{
            autoplay: true,
            muted: true,
            loop: { active: true },
            controls: [],
          }}
        />
      ) : (
        <div className="aspect-video w-72 max-w-full rounded-md bg-muted animate-pulse" />
      )}
      <CardDescription className="absolute bottom-2.5 right-2.5 text-primary">
        {formatDate(date, "HH:mm")}
      </CardDescription>
    </Card>
  );
};
