'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { User, Video, FileText, Film, Settings } from 'lucide-react'

interface MainNavProps {
  className?: string;
  isAdminView?: boolean;
}

export function MainNav({ className, isAdminView }: MainNavProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (isAdminView) {
    return null;
  }

  const routes = [
    {
      href: "/projects",
      label: "My Projects",
      icon: <Video className="h-4 w-4 mr-2" />,
      active: pathname === "/projects",
    },
    {
      href: "/edit",
      label: "Video Editor",
      icon: <Film className="h-4 w-4 mr-2" />,
      active: pathname === "/edit",
    },
    {
      href: "/scriptwriter",
      label: "Script Generator",
      icon: <FileText className="h-4 w-4 mr-2" />,
      active: pathname === "/scriptwriter",
    },
    ...(user?.isAdmin ? [{
      href: "/admin",
      label: "Admin Dashboard",
      icon: <Settings className="h-4 w-4 mr-2" />,
      active: pathname === "/admin",
    }] : [])
  ]

  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
          <Link
            href="/"
            className="text-2xl font-bold text-primary flex items-center"
          >
            Vision Vox
          </Link>
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                route.active
                  ? "text-black dark:text-white"
                  : "text-muted-foreground"
              )}
            >
              {route.icon}
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/projects" className="cursor-pointer">
                    My Projects
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => logout()}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/login">
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 