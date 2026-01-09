import { requireProfile } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireProfile()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile Navigation Header */}
      <div className="md:hidden flex items-center p-4 border-b bg-white">
        <MobileNav profile={profile} />
        <span className="ml-4 font-semibold text-lg">Chisan Paper</span>
      </div>

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar profile={profile} />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
