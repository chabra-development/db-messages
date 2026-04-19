import {
  File,
  FileAudio,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideProps,
} from "lucide-react";
import Image from "next/image";

/* ──────────────────────────────────────────
 * Mapa de MIME → ícone PNG em /public
 * ────────────────────────────────────────── */
const MIME_PNG_MAP: Record<string, string> = {
  // PDF
  "application/pdf": "/files-types/pdf.svg",

  // Word
  "application/msword": "/files-types/doc.svg",
  "application/vnd.oasis.opendocument.text": "/files-types/doc.svg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "/files-types/docx.svg",

  // Excel / Planilhas
  "application/vnd.ms-excel": "/files-types/xls.svg",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "/files-types/xls.svg",
  "application/vnd.oasis.opendocument.spreadsheet": "/files-types/xls.svg",
  "text/csv": "/files-types/csv.svg",

  // Texto
  "text/plain": "/files-types/txt.svg",

  // XML
  "application/xml": "/files-types/xml.svg",
  "text/xml": "/files-types/xml.svg",

  // Compactados
  "application/zip": "/files-types/zip.svg",
  "application/x-zip-compressed": "/files-types/zip.svg",
  "application/x-rar-compressed": "/files-types/zip.svg",
  "application/x-7z-compressed": "/files-types/zip.svg",
  "application/gzip": "/files-types/zip.svg",
  "application/x-tar": "/files-types/zip.svg",
};

/* ──────────────────────────────────────────
 * Fallback Lucide para tipos sem PNG
 * ────────────────────────────────────────── */
interface LucideFallbackMeta {
  icon: React.ElementType<LucideProps>;
  color: string;
}

const MIME_LUCIDE_MAP: Record<string, LucideFallbackMeta> = {
  "application/vnd.ms-powerpoint": {
    icon: FileText,
    color: "#D24726",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: FileText,
    color: "#D24726",
  },
  "application/vnd.oasis.opendocument.presentation": {
    icon: FileText,
    color: "#D24726",
  },
  "application/json": {
    icon: FileJson,
    color: "#F5A623",
  },
  "text/html": {
    icon: FileText,
    color: "#E34C26",
  },
};

function getLucideFallback(mimeType: string): LucideFallbackMeta {
  const exact = MIME_LUCIDE_MAP[mimeType];
  if (exact) return exact;

  const [category] = mimeType.split("/");
  if (category === "image") return { icon: FileImage, color: "#8B5CF6" };
  if (category === "video") return { icon: FileVideo, color: "#3B82F6" };
  if (category === "audio") return { icon: FileAudio, color: "#EC4899" };
  if (category === "text") return { icon: FileText, color: "#6B7280" };
  if (category === "application")
    return { icon: FileSpreadsheet, color: "#6B7280" };

  return { icon: File, color: "#9CA3AF" };
}

/* ──────────────────────────────────────────
 * Componente
 * ────────────────────────────────────────── */
interface FileTypeIconProps extends LucideProps {
  mimeType: string;
}

export function FileTypeIcon({
  mimeType,
  size = 24,
  color,
  className,
  ...props
}: FileTypeIconProps) {
  const pngSrc = MIME_PNG_MAP[mimeType];

  if (pngSrc) {
    const px = typeof size === "number" ? size : 24;
    return (
      <Image
        src={pngSrc}
        alt={mimeType}
        width={px}
        height={px}
        className={className}
      />
    );
  }

  const { icon: Icon, color: defaultColor } = getLucideFallback(mimeType);
  return (
    <Icon
      size={size}
      color={color ?? defaultColor}
      className={className}
      {...props}
    />
  );
}
