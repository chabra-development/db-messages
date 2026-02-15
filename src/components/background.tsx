"use client"

import { useLightRaysColor } from "@/hooks/use-light-rays-color"
import { LightRays } from "./ui/light-rays"
import { LayoutProps } from "@/types/index.types"

export const Background = ({ children }: LayoutProps) => {
	const lightRaysColor = useLightRaysColor("accent")

	return (
		<div className="relative h-screen w-full max-w-full min-w-0 z-0 overflow-hidden">
			<LightRays speed={30} color={lightRaysColor} />
			<div className="w-full h-full max-w-full min-w-0 overflow-hidden">
				{children}
			</div>
		</div>
	)
}