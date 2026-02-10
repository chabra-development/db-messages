import { env } from '@/env'
import { createClient } from '@supabase/supabase-js'
import z from 'zod'

const envSchema = z.object({
    SUPABASE_URL: z.url(),
    SUPABASE_KEY: z.string().min(1),
})

const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_KEY

const { data } = envSchema.safeParse({ SUPABASE_KEY, SUPABASE_URL })

if (!data) {
    throw new Error('Invalid or missing SUPABASE_URL or SUPABASE_KEY in environment variables')
}

const { SUPABASE_URL: url, SUPABASE_KEY: key } = data

export const supabase = createClient(url, key)