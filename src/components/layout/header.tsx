import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "../theme-toggle"

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
