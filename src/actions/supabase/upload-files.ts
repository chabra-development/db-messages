"use server"

import { generateNameFile } from "@/actions/supabase/generate-file-name"
import { BUCKET_NAME } from "@/constraints/bucket"
import { supabase } from "@/lib/supabase"
import { getPublicUrl } from "./get-public-url"

export async function deleteFile(filename: string) {

    const removeFile = await supabase.storage.from(BUCKET_NAME).remove([filename])

    if (removeFile.error) throw new Error("Não foi possivel excluir o arquivo")
}

export async function updateFile(file: File) {

    const filename = generateNameFile({
        filename: file.name,
        type: file.type
    })

    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(filename, file, {
            cacheControl: "0",
            upsert: true,
            contentType: file.type,
        })

    if (error) {

        console.log(error)

        throw new Error(error.message)
    }

    return data
}

export async function uploadFile(file: File) {

    const { path } = await updateFile(file)

    const publicUrl = getPublicUrl(path)

    return publicUrl
}