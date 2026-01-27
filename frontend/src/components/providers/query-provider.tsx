"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const [DevTools, setDevTools] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@tanstack/react-query-devtools').then((mod) => {
        setDevTools(() => mod.ReactQueryDevtools)
      })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {DevTools && <DevTools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}