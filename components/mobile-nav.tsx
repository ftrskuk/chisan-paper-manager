'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/sidebar'
import type { Profile } from '@/types/database'

export function MobileNav({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        {/* Pass a prop to Sidebar to indicate it's in mobile mode if needed, 
            or just reuse it as is since it renders navigation links. 
            We need to wrap it to remove the fixed positioning or height if defined.
            The current sidebar has 'min-h-screen' and 'w-64'. 
            We'll override styles via a wrapper or modify Sidebar to accept className.
        */}
        <div className="h-full">
           <Sidebar profile={profile} mobile />
        </div>
      </SheetContent>
    </Sheet>
  )
}
