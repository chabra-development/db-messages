import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LimeMediaContent } from "@/types/lime-thread-messages-response.types";
import { Images, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ImageItem } from "./image-item";
import { VideoItem } from "./video-item";

type Message = {
  id: string;
  content: LimeMediaContent;
  sentAt: Date;
};

export const AllMediasDialog = ({ messages }: { messages: Message[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"secondary"}>
          <Images />
          Mostrar todas as midias
        </Button>
      </DialogTrigger>
      <DialogContent className="size-10/12 max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Mídias</DialogTitle>
          <DialogDescription>
            {current + 1} de {messages.length}
          </DialogDescription>
        </DialogHeader>
        <div className="px-12">
          <Carousel className="w-full" setApi={setApi}>
            <CarouselContent>
              {messages.map(({ id, content }) => {
                const mediaWithImage = content.type.includes("image");
                const mediaWithVideo = content.type.includes("video");

                if (mediaWithImage) {
                  return <ImageItem key={id} id={id} uri={content.uri} />;
                }

                if (mediaWithVideo) {
                  return (
                    <VideoItem
                      key={id}
                      id={id}
                      uri={content.uri}
                      type={content.type}
                    />
                  );
                }
              })}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
        <ScrollArea className="w-full border-t pt-3">
          <div className="flex justify-center gap-2 py-2">
            {messages.map(({ id, content }, index) => {
              const mediaWithImage = content.type.includes("image");
              const mediaWithVideo = content.type.includes("video");
              const isActive = index === current;

              if (mediaWithImage) {
                return (
                  <button
                    key={id}
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "size-16 shrink-0 rounded overflow-hidden ring-2 ring-offset-1 transition-all",
                      isActive
                        ? "ring-primary"
                        : "ring-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <img
                      src={content.uri}
                      alt={`${id}_thumb`}
                      className="size-full object-cover"
                    />
                  </button>
                );
              }

              if (mediaWithVideo) {
                return (
                  <button
                    key={id}
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "size-16 shrink-0 rounded overflow-hidden ring-2 ring-offset-1 transition-all bg-muted flex items-center justify-center",
                      isActive
                        ? "ring-primary"
                        : "ring-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <Video className="size-5 text-muted-foreground" />
                  </button>
                );
              }
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
