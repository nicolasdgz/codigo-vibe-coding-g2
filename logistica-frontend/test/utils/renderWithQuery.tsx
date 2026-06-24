import React from 'react'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = makeQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function renderWithQuery(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Wrapper, ...options })
}

export function renderHookWithQuery<T>(hook: () => T) {
  return renderHook(hook, { wrapper: Wrapper })
}
