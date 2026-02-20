import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { BackgroundProvider } from "@/providers/background-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import { Roboto_Mono } from "next/font/google"
import { ReactNode } from "react"
import "./globals.css"

const roboto = Roboto_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head />
      <body className={cn(roboto.className, "antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
        >
          <BackgroundProvider>
            {children}
          </BackgroundProvider>
        </ThemeProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}