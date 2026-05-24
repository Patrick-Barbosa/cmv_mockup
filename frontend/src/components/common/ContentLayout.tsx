import { ReactNode } from "react"

interface ContentLayoutProps {
  main: ReactNode
  sidebar: ReactNode
  sidebarWidth?: "260px" | "280px" | "300px" | "320px"
  className?: string
}

const widthMap = {
  "260px": "grid lg:grid-cols-[1fr_260px]",
  "280px": "grid lg:grid-cols-[1fr_280px]",
  "300px": "grid lg:grid-cols-[1fr_300px]",
  "320px": "grid lg:grid-cols-[1fr_320px]",
}

export function ContentLayout({
  main,
  sidebar,
  sidebarWidth = "280px",
  className = "",
}: ContentLayoutProps) {
  return (
    <div className={`${widthMap[sidebarWidth]} gap-8 items-start ${className}`}>
      <div className="flex flex-col gap-6">{main}</div>
      <div className="flex flex-col gap-4">{sidebar}</div>
    </div>
  )
}

interface FullWidthLayoutProps {
  children: ReactNode
  className?: string
}

export function FullWidthLayout({ children, className = "" }: FullWidthLayoutProps) {
  return <div className={`flex flex-col gap-6 ${className}`}>{children}</div>
}