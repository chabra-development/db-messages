type GenerateNameFileProps = {
    filename: string
    type: string
}

export function generateNameFile({ filename, type }: GenerateNameFileProps) {
    return `${Date.now()}_${filename}.${type.split("/")[1]}`
}