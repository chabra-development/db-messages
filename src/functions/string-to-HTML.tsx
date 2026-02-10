import { ComponentProps } from "react"

export function stringToHTML(html: string, props?: ComponentProps<"div">) {
	return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />
}
