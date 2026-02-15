// src/actions/posts/get-posts.ts
'use server'

// Simulando uma API com delay
async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

interface Post {
    id: number
    title: string
    body: string
}

interface GetPostsResponse {
    posts: Post[]
    nextPage: number | null
}

export async function getPosts(page: number = 1): Promise<GetPostsResponse> {
    // Simula delay de rede
    await delay(1000)

    // Gera 10 posts por página
    const posts: Post[] = Array.from({ length: 10 }, (_, i) => {
        const postNumber = (page - 1) * 10 + i + 1
        return {
            id: postNumber,
            title: `Post ${postNumber}`,
            body: `Conteúdo do post número ${postNumber}`
        }
    })

    // Vamos simular que só temos 5 páginas (50 posts total)
    const hasMore = page < 5
    const nextPage = hasMore ? page + 1 : null

    return {
        posts,
        nextPage
    }
}