"use client"

import { useLightRaysColor } from "@/hooks/use-light-rays-color"
import { LightRays } from "./ui/light-rays"
import { LayoutProps } from "@/types/index.types"

export const Background = ({ children }: LayoutProps) => {

	const lightRaysColor = useLightRaysColor("accent")

	return (
		<div className="relative h-dvh z-0 w-full overflow-hidden rounded-xl border">
			<LightRays speed={30} color={lightRaysColor} />
			{children}
		</div>
	)
}
