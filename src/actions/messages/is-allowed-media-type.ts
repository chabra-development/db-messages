const ALLOWED_MEDIA_TYPES =
    "image/jpeg, image/png, image/gif, image/webp, audio/ogg, audio/mpeg, audio/mp4, audio/aac, video/mp4, video/ogg, video/webm, application/pdf"

const allowedMediaTypesArray = ALLOWED_MEDIA_TYPES.split(", ")

export function isAllowedMediaType(type: string): boolean {
    return allowedMediaTypesArray.includes(type)
}