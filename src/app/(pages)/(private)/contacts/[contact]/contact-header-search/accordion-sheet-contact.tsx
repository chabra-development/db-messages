import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LimeMediaContent } from "@/types/lime-thread-messages-response.types";
import { FileText, FileType, ImageIcon, Music2, SquarePlay } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), {
  ssr: true,
});

type Message = {
  id: string;
  content: LimeMediaContent;
  sentAt: Date;
};

const ITEM_LIMIT = 12;

// Img com fallback silencioso pra URIs broken (blipmediastore expirado, etc).
// Bug 3c: muitos thumbs caem em 4xx → próximo/<Image> dispara erro; aqui só esconde.
function ThumbWithFallback({ src, alt }: { src: string; alt: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHidden(true)}
      className="size-full object-cover"
    />
  );
}

function isType(content: LimeMediaContent, prefix: string): boolean {
  return !!(content?.uri && content?.type && content.type.includes(prefix));
}

function isDoc(content: LimeMediaContent): boolean {
  if (!content?.uri || !content?.type) return false;
  if (!content.type.startsWith("application/")) return false;
  // Stickers já são filtrados upstream em findMessagesMediaByContactId;
  // aqui caímos em PDF, Office, zip, etc.
  return true;
}

function getFileName(uri: string): string {
  try {
    const parts = uri.split("/");
    return decodeURIComponent(parts[parts.length - 1].split("?")[0]);
  } catch {
    return "arquivo";
  }
}

function getDocLabel(type: string): string {
  if (type === "application/pdf") return "PDF";
  if (type.includes("wordprocessingml")) return "DOCX";
  if (type === "application/msword") return "DOC";
  if (type.includes("spreadsheetml")) return "XLSX";
  if (type === "application/vnd.ms-excel") return "XLS";
  if (type.includes("presentationml")) return "PPTX";
  if (type === "application/vnd.ms-powerpoint") return "PPT";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "ZIP";
  return type.split("/")[1]?.toUpperCase() ?? "ARQUIVO";
}

export const AccordeonSheetContact = ({
  messages,
}: {
  messages: Message[];
}) => {
  const imageMessages = messages
    .filter((m) => isType(m.content, "image"))
    .slice(0, ITEM_LIMIT);

  const videoMessages = messages
    .filter((m) => isType(m.content, "video"))
    .slice(0, ITEM_LIMIT);

  const audioMessages = messages
    .filter((m) => isType(m.content, "audio"))
    .slice(0, ITEM_LIMIT);

  const docMessages = messages
    .filter((m) => isDoc(m.content))
    .slice(0, ITEM_LIMIT);

  return (
    <Accordion type="multiple">
      <AccordionItem value="images">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            Imagens ({imageMessages.length})
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-wrap gap-2">
          {imageMessages.length === 0 && (
            <span className="text-xs text-muted-foreground px-1">Sem imagens neste contato.</span>
          )}
          {imageMessages.map(({ id, content }) => (
            <div key={id} className="size-25 overflow-hidden rounded bg-muted">
              <ThumbWithFallback src={content.uri} alt={`${id}_image`} />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="videos">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <SquarePlay className="size-4" />
            Videos ({videoMessages.length})
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-wrap gap-2">
          {videoMessages.length === 0 && (
            <span className="text-xs text-muted-foreground px-1">Sem videos neste contato.</span>
          )}
          {videoMessages.map(({ id, content }) => (
            <div key={id} className="w-1/4 pointer-events-none">
              <Plyr
                source={{
                  type: "video",
                  sources: [{ src: content.uri, type: "video/mp4", size: 160 }],
                }}
                options={{
                  autoplay: false,
                  muted: true,
                  controls: [],
                  clickToPlay: false,
                }}
              />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="audios">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <Music2 className="size-4" />
            Audios ({audioMessages.length})
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2">
          {audioMessages.length === 0 && (
            <span className="text-xs text-muted-foreground px-1">Sem audios neste contato.</span>
          )}
          {audioMessages.map(({ id, content }) => (
            <audio
              key={id}
              src={content.uri}
              controls
              preload="none"
              className="w-full"
            />
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="docs">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <FileText className="size-4" />
            Documentos ({docMessages.length})
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2">
          {docMessages.length === 0 && (
            <span className="text-xs text-muted-foreground px-1">Sem documentos neste contato.</span>
          )}
          {docMessages.map(({ id, content }) => (
            <a
              key={id}
              href={content.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm border"
              title={getFileName(content.uri)}
            >
              <FileType className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{getFileName(content.uri)}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {getDocLabel(content.type)}
              </span>
            </a>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
