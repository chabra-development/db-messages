"use client";

import { getPublicUrl } from "@/actions/supabase/get-public-url";
import { useQuery } from "@tanstack/react-query";

/**
 * SEC-01: resolve a URI de mídia (URL completa já persistida em
 * messages.content.uri OU key relativa) para uma pre-signed URL de leitura.
 * Substitui o uso direto da URL pública crua, que dependia de `anonymous
 * download` no bucket. staleTime (5 min) < TTL da assinatura (10 min) garante
 * re-assinatura antes de expirar.
 */
export function useSignedUrl(uri: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", uri],
    queryFn: () => getPublicUrl(uri as string),
    enabled: Boolean(uri),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
