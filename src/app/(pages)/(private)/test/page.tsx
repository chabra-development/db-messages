'use client'

import { usePosts } from './use-posts'
import { Loader2 } from 'lucide-react'
import { useRef, useEffect } from 'react'

export default function Home() {

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = usePosts()

    // Ref para o elemento "trigger" no final da lista
    const observerTarget = useRef<HTMLDivElement>(null)

    // Intersection Observer - detecta quando o elemento fica visível
    useEffect(() => {
        const element = observerTarget.current
        if (!element) return

        const observer = new IntersectionObserver(
            (entries) => {
                // Se o elemento está visível E tem mais páginas E não está carregando
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                }
            },
            {
                threshold: 1.0, // 100% do elemento precisa estar visível
                rootMargin: '0px', // Sem margem extra
            }
        )

        observer.observe(element)

        // Cleanup
        return () => {
            if (element) {
                observer.unobserve(element)
            }
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage])

    // Loading inicial (primeira vez)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Carregando posts...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Erro ao carregar posts</p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                </div>
            </div>
        )
    }

    // Junta todos os posts de todas as páginas
    const allPosts = data?.pages.flatMap(page => page.posts) ?? []

    return (
        <div className="w-full mx-auto overflow-scroll">
            {/* Header fixo */}
            <div className="sticky top-0 z-10 bg-background border-b p-4">
                <h1 className="text-2xl font-bold">Feed de Posts</h1>
            </div>

            {/* Lista de posts */}
            <div className="divide-y">
                {allPosts.map((post, index) => (
                    <article
                        key={post.id}
                        className="p-6 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar simulado */}
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold">
                                    {post.id}
                                </span>
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-lg mb-1">
                                    {post.title}
                                </h2>
                                <p className="text-muted-foreground">
                                    {post.body}
                                </p>

                                {/* Meta info */}
                                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                    <span>Post #{post.id}</span>
                                    <span>•</span>
                                    <span>Página {Math.ceil(post.id / 10)}</span>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* Elemento observador (invisível) */}
            <div
                ref={observerTarget}
                className="flex justify-center py-8"
            >
                {isFetchingNextPage && (
                    <div className="text-center space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Carregando mais posts...
                        </p>
                    </div>
                )}
            </div>

            {/* Fim da lista */}
            {!hasNextPage && allPosts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">🎉 Você chegou ao fim!</p>
                    <p className="text-xs mt-1">
                        {allPosts.length} posts carregados
                    </p>
                </div>
            )}

            {/* Lista vazia */}
            {allPosts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <p>Nenhum post encontrado</p>
                </div>
            )}
        </div>
    )
}
