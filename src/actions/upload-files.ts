"use server"

import { supabase } from "@/lib/supabase"

export function getPublicUrl(path: string) {

    const { data } = supabase.storage.from("db-message").getPublicUrl(path)

    const publicUrl = data.publicUrl

    return publicUrl
}

export function generateNameFile(filename: string) {
    return `${new Date()}_${filename}`
}

export async function deleteFile(filename: string) {

    const removeFile = await supabase.storage.from("db-message").remove([filename])

    if (removeFile.error) throw new Error("Não foi possivel excluir o arquivo")
}

export async function updateFile(file: File) {

    const filename = generateNameFile(file.name)

    const { data, error } = await supabase
        .storage
        .from("db-message")
        .upload(filename, file, {
            cacheControl: "0",
            upsert: true,
            contentType: file.type,
        })

    if (error) throw new Error("Não foi possivel atualizar a imagem")

    return data
}

export async function uploadFile(file: File) {

    const { path } = await updateFile(file)

    const publicUrl = getPublicUrl(path)

    return publicUrl
}