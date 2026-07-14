import { useQuery } from '@tanstack/vue-query'
import { useCustomContentStore } from '@/custom-content/store'

// Shared community feed loader. All three section pages (classes / subclasses / races)
// use the same query key, so TanStack Query loads the public feed once and serves it
// from cache while navigating between sections. Public read, works for guests (RLS).
export function useCommunityFeed() {
  const customContent = useCustomContentStore()
  const { data: items, isPending, isError } = useQuery({
    queryKey: ['community'],
    queryFn: () => customContent.loadCommunity(),
    staleTime: 60_000,
  })
  return { items, isPending, isError }
}
