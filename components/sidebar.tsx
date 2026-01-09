'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface SidebarProps {
  profile: Profile
  mobile?: boolean
}

const navItems = [
  { href: '/products', label: 'Products', adminOnly: false },
  { href: '/products/compare', label: 'Compare', adminOnly: false },
  { href: '/products/upload', label: 'Upload TDS', adminOnly: true },
  { href: '/categories', label: 'Categories', adminOnly: true },
]

export function Sidebar({ profile, mobile = false }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside 
      className={cn(
        "bg-gray-50 p-4 relative h-full flex flex-col",
        mobile ? "w-full min-h-full border-none" : "w-64 min-h-screen border-r"
      )}
    >
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Chisan Paper</h1>
        <p className="text-sm text-gray-500">Technical Data Manager</p>
      </div>

      <nav className="space-y-1 flex-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={cn(
        "mt-auto pt-4 border-t",
        mobile ? "pb-8" : "absolute bottom-4 left-4 right-4"
      )}>
        <p className="text-sm text-gray-600 truncate">{profile.email}</p>
        <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
