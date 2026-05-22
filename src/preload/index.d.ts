import type { EmApi } from '../shared/ipc'

declare global {
  interface Window {
    emApi: EmApi
  }
}

export {}
