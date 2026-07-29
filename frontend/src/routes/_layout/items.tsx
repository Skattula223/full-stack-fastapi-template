import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Download, Search } from "lucide-react"
import { Suspense, useEffect, useState } from "react"

import { ItemsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/Items/AddItem"
import { columns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useCustomToast from "@/hooks/useCustomToast"

function getItemsQueryOptions(search: string) {
  return {
    queryFn: () =>
      ItemsService.readItems({ skip: 0, limit: 100, q: search || undefined }),
    queryKey: ["items", search],
  }
}

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  head: () => ({
    meta: [
      {
        title: "Items - FastAPI Template",
      },
    ],
  }),
})

function ItemsTableContent({ search }: { search: string }) {
  const { data: items } = useSuspenseQuery(getItemsQueryOptions(search))

  if (items.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          {search ? "No items match your search" : "You don't have any items yet"}
        </h3>
        <p className="text-muted-foreground">
          {search
            ? "Try a different search term"
            : "Add a new item to get started"}
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={items.data} />
}

function ItemsTable({ search }: { search: string }) {
  return (
    <Suspense fallback={<PendingItems />}>
      <ItemsTableContent search={search} />
    </Suspense>
  )
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

function ExportButton({ search }: { search: string }) {
  const { showErrorToast } = useCustomToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("q", search)

      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/items/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "items.csv"
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      showErrorToast("Could not export items")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      <Download className="h-4 w-4" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  )
}

function Items() {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">Create and manage your items</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton search={debouncedSearch} />
          <AddItem />
        </div>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8"
        />
      </div>
      <ItemsTable search={debouncedSearch} />
    </div>
  )
}
