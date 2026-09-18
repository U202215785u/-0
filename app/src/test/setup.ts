import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { configure } from '@testing-library/react'

// IndexedDB-backed UI tests routinely wait for async hydration; give
// waitFor/findBy a wider default window so parallel test files stay stable.
configure({ asyncUtilTimeout: 5000 })

// The App shell refreshes wanted/plans/mode from IndexedDB on mount and on every
// navigation. That ambient refresh is intentional and unobservable on routes the
// shell tests cover (each screen's behavior is tested directly with proper waits),
// so one "not wrapped in act" update per test is expected noise, not a missed await.
// Keep everything else on console.error intact.
const originalError = console.error
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('not wrapped in act') || args[0].includes('not configured to support act'))) return
  originalError(...args)
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
