const MIME_LABELS: Record<string, string> = {
  // Documentos Office (antigo)
  "application/msword": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.ms-powerpoint": "PowerPoint",

  // Documentos Office (Open XML)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PowerPoint",

  // OpenDocument
  "application/vnd.oasis.opendocument.text": "ODT",
  "application/vnd.oasis.opendocument.spreadsheet": "ODS",
  "application/vnd.oasis.opendocument.presentation": "ODP",

  // PDF e texto
  "application/pdf": "PDF",
  "text/plain": "Texto",
  "text/csv": "CSV",
  "text/html": "HTML",

  // Compactados
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
  "application/x-rar-compressed": "RAR",
  "application/x-7z-compressed": "7-Zip",
  "application/gzip": "GZIP",
  "application/x-tar": "TAR",

  // Imagens
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WebP",
  "image/svg+xml": "SVG",
  "image/bmp": "BMP",
  "image/tiff": "TIFF",

  // Vídeos
  "video/mp4": "MP4",
  "video/webm": "WebM",
  "video/ogg": "OGG",
  "video/quicktime": "MOV",
  "video/x-msvideo": "AVI",

  // Áudios
  "audio/mpeg": "MP3",
  "audio/ogg": "OGG",
  "audio/wav": "WAV",
  "audio/webm": "WebM",
  "audio/aac": "AAC",
  "audio/opus": "Opus",

  // Outros
  "application/json": "JSON",
  "application/xml": "XML",
  "text/xml": "XML",
  "application/octet-stream": "Arquivo",
};

export function getMimeLabel(mimeType: string): string {
  const exact = MIME_LABELS[mimeType];

  if (exact) return exact;

  const [category] = mimeType.split("/");

  if (category === "image") return "Imagem";
  if (category === "video") return "Vídeo";
  if (category === "audio") return "Áudio";
  if (category === "text") return "Texto";

  return "Arquivo";
}
