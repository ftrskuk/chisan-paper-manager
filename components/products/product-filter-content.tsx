import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { ProductFilters, FilterOption } from '@/types/filters'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductFilterContentProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  categories: FilterOption[]
  mills: FilterOption[]
  setOpen?: (open: boolean) => void
  viewMode?: 'desktop' | 'mobile'
}

export function ProductFilterContent({
  filters,
  onFiltersChange,
  categories,
  mills,
  setOpen,
  viewMode = 'desktop',
}: ProductFilterContentProps) {
  
  const updateFilter = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const updateRangeFilter = (
    minKey: keyof ProductFilters,
    maxKey: keyof ProductFilters,
    min: string,
    max: string
  ) => {
    onFiltersChange({
      ...filters,
      [minKey]: min ? parseFloat(min) : undefined,
      [maxKey]: max ? parseFloat(max) : undefined,
    })
  }

  const toggleArrayFilter = (
    key: 'categoryIds' | 'millNames',
    value: string
  ) => {
    const current = filters[key] || []
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    
    updateFilter(key, updated.length > 0 ? updated : undefined)
  }

  const clearFilters = () => {
    onFiltersChange({ search: filters.search })
    setOpen?.(false)
  }

  const activeFilterCount = Object.keys(filters).filter(k => k !== 'search' && filters[k as keyof ProductFilters] !== undefined).length

  return (
    <div className={cn(
      "flex flex-col h-full",
      viewMode === 'desktop' ? "w-[340px] h-[500px]" : "w-full"
    )}>
      {viewMode === 'desktop' && (
        <div className="p-4 flex items-center justify-between border-b bg-gray-50/40">
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-blue-600 h-8 px-2 hover:bg-blue-50"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* For mobile, we want the clear button inside the content area or near the top if not using the popover header */}
      {viewMode === 'mobile' && activeFilterCount > 0 && (
        <div className="px-4 pb-2 pt-0 flex justify-end">
             <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-blue-600 h-8 px-2 hover:bg-blue-50"
            >
              Clear all
            </Button>
        </div>
      )}

      <ScrollArea className="flex-1 px-4">
        <Accordion type="multiple" defaultValue={['category', 'mill']} className="w-full pb-8">
          {/* Categories */}
          <AccordionItem value="category">
            <AccordionTrigger className="text-sm font-medium py-3">
              Category
              {filters.categoryIds?.length ? (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filters.categoryIds.length}
                </Badge>
              ) : null}
            </AccordionTrigger>
            <AccordionContent>
              <Command className="border rounded-md">
                <CommandInput placeholder="Search categories..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup className="max-h-[140px] overflow-y-auto">
                    {categories.map((category) => (
                      <CommandItem
                        key={category.value}
                        onSelect={() => toggleArrayFilter('categoryIds', category.value)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            (filters.categoryIds || []).includes(category.value)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <CheckIcon className={cn("h-3 w-3")} />
                        </div>
                        <span>{category.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </AccordionContent>
          </AccordionItem>

          {/* Mills */}
          <AccordionItem value="mill">
            <AccordionTrigger className="text-sm font-medium py-3">
              Mill
              {filters.millNames?.length ? (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filters.millNames.length}
                </Badge>
              ) : null}
            </AccordionTrigger>
            <AccordionContent>
              <Command className="border rounded-md">
                <CommandInput placeholder="Search mills..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No mill found.</CommandEmpty>
                  <CommandGroup className="max-h-[140px] overflow-y-auto">
                    {mills.map((mill) => (
                      <CommandItem
                        key={mill.value}
                        onSelect={() => toggleArrayFilter('millNames', mill.value)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            (filters.millNames || []).includes(mill.value)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <CheckIcon className={cn("h-3 w-3")} />
                        </div>
                        <span>{mill.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </AccordionContent>
          </AccordionItem>

          {/* Physical Properties */}
          <AccordionItem value="physical">
            <AccordionTrigger className="text-sm font-medium py-3">Physical Properties</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <RangeInputGroup
                label="GSM (g/m²)"
                min={filters.gsmMin}
                max={filters.gsmMax}
                onChange={(min, max) => updateRangeFilter('gsmMin', 'gsmMax', min, max)}
              />
              <RangeInputGroup
                label="Caliper (µm)"
                min={filters.caliperMin}
                max={filters.caliperMax}
                onChange={(min, max) => updateRangeFilter('caliperMin', 'caliperMax', min, max)}
                step="0.1"
              />
              <RangeInputGroup
                label="Density (g/cm³)"
                min={filters.densityMin}
                max={filters.densityMax}
                onChange={(min, max) => updateRangeFilter('densityMin', 'densityMax', min, max)}
                step="0.01"
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="optical">
            <AccordionTrigger className="text-sm font-medium py-3">Optical Properties</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <RangeInputGroup
                label="Brightness (%)"
                min={filters.brightnessMin}
                max={filters.brightnessMax}
                onChange={(min, max) => updateRangeFilter('brightnessMin', 'brightnessMax', min, max)}
                step="0.1"
              />
              <RangeInputGroup
                label="Opacity (%)"
                min={filters.opacityMin}
                max={filters.opacityMax}
                onChange={(min, max) => updateRangeFilter('opacityMin', 'opacityMax', min, max)}
                step="0.1"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="strength">
            <AccordionTrigger className="text-sm font-medium py-3">Strength Properties</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <RangeInputGroup
                label="Tensile MD (kN/m)"
                min={filters.tensileMdMin}
                max={filters.tensileMdMax}
                onChange={(min, max) => updateRangeFilter('tensileMdMin', 'tensileMdMax', min, max)}
                step="0.1"
              />
               <RangeInputGroup
                label="Tensile CD (kN/m)"
                min={filters.tensileCdMin}
                max={filters.tensileCdMax}
                onChange={(min, max) => updateRangeFilter('tensileCdMin', 'tensileCdMax', min, max)}
                step="0.1"
              />
              <RangeInputGroup
                label="Tear MD (mN)"
                min={filters.tearMdMin}
                max={filters.tearMdMax}
                onChange={(min, max) => updateRangeFilter('tearMdMin', 'tearMdMax', min, max)}
              />
               <RangeInputGroup
                label="Tear CD (mN)"
                min={filters.tearCdMin}
                max={filters.tearCdMax}
                onChange={(min, max) => updateRangeFilter('tearCdMin', 'tearCdMax', min, max)}
              />
            </AccordionContent>
          </AccordionItem>
          
           <AccordionItem value="surface">
            <AccordionTrigger className="text-sm font-medium py-3">Surface Properties</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
              <RangeInputGroup
                label="Smoothness"
                min={filters.smoothnessMin}
                max={filters.smoothnessMax}
                onChange={(min, max) => updateRangeFilter('smoothnessMin', 'smoothnessMax', min, max)}
                step="0.1"
              />
              <RangeInputGroup
                label="Cobb 60 (g/m²)"
                min={filters.cobb60Min}
                max={filters.cobb60Max}
                onChange={(min, max) => updateRangeFilter('cobb60Min', 'cobb60Max', min, max)}
                step="1"
              />
              <RangeInputGroup
                label="Moisture (%)"
                min={filters.moistureMin}
                max={filters.moistureMax}
                onChange={(min, max) => updateRangeFilter('moistureMin', 'moistureMax', min, max)}
                step="0.1"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      
      {viewMode === 'mobile' && (
        <div className="p-4 border-t mt-auto">
          <Button onClick={() => setOpen?.(false)} className="w-full">
            Show Results
          </Button>
        </div>
      )}
    </div>
  )
}

function RangeInputGroup({ 
  label, 
  min, 
  max, 
  onChange, 
  step = '1' 
}: { 
  label: string
  min?: number
  max?: number
  onChange: (min: string, max: string) => void
  step?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min ?? ''}
          onChange={(e) => onChange(e.target.value, max?.toString() ?? '')}
          step={step}
          className="h-8 text-sm"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={max ?? ''}
          onChange={(e) => onChange(min?.toString() ?? '', e.target.value)}
          step={step}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
