'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getPosts } from './get-posts'

export function usePosts() {
    return useInfiniteQuery({
        queryKey: ['posts'],
        queryFn: async ({ pageParam }) => {
            const data = await getPosts(pageParam)
            return data
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            return lastPage.nextPage
        },
    })
}