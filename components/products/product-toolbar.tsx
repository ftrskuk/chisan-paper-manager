import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ProductFilterContent } from './product-filter-content'
import { Search, ListFilter } from 'lucide-react'
import type { ProductFilters, FilterOption } from '@/types/filters'
import { Badge } from '@/components/ui/badge'
import { useMediaQuery } from '@/hooks/use-media-query'

interface ProductToolbarProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  categories: FilterOption[]
  mills: FilterOption[]
}

export function ProductToolbar({
  filters,
  onFiltersChange,
  categories,
  mills,
}: ProductToolbarProps) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const activeFilterCount = Object.keys(filters).filter(
    (k) => k !== 'search' && filters[k as keyof ProductFilters] !== undefined
  ).length

  const FilterButton = (
    <Button variant="outline" className="h-10 px-3 lg:px-4 gap-2 relative bg-white">
      <ListFilter className="h-4 w-4" />
      <span className="hidden sm:inline">Filters</span>
      {activeFilterCount > 0 && (
        <Badge
          variant="secondary"
          className="h-5 px-1.5 ml-0.5 text-[10px] min-w-5 justify-center bg-gray-100 text-gray-900 hover:bg-gray-200"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  )

  return (
    <div className="flex items-center gap-2 mb-4 lg:mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9 bg-white"
        />
      </div>

      {isDesktop ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {FilterButton}
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto" align="end" sideOffset={8}>
            <ProductFilterContent
              filters={filters}
              onFiltersChange={onFiltersChange}
              categories={categories}
              mills={mills}
              setOpen={setOpen}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            {FilterButton}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="px-4 py-4 border-b text-left">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="h-full pb-12">
               <ProductFilterContent
                filters={filters}
                onFiltersChange={onFiltersChange}
                categories={categories}
                mills={mills}
                setOpen={setOpen}
                viewMode="mobile"
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
