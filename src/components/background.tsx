import { LightRays } from "./ui/light-rays"
import { LayoutProps } from "@/types/index.types"

export const Background = ({ children }: LayoutProps) => {
	return (
		<div className="relative h-dvh z-0 w-full overflow-hidden rounded-xl border">
			<LightRays />
			{children}
		</div>
	)
}
