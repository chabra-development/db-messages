export async function generateVideoThumbnail(url: string) {

    const video = document.createElement("video")

    video.src = url
    video.crossOrigin = "anonymous"
    video.muted = true
    video.playsInline = true

    await new Promise<void>((resolve, reject) => {

        video.addEventListener("loadedmetadata", () => resolve(), {
            once: true
        })

        video.addEventListener("error", () => {
            reject(new Error(`erro ao carregar arquivo`))
        }, {
            once: true
        })
    })

    video.currentTime = video.duration / 2

    await new Promise<void>((resolve, reject) => {
        video.addEventListener("seeked", () => resolve(), { once: true })
        video.addEventListener("error", () => {
            reject(new Error("Falha ao buscar frame do vídeo"))
        }, { once: true })
    })

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Não foi possível obter contexto do canvas")

    ctx.drawImage(video, 0, 0)

    return canvas.toDataURL("image/jpeg")
}