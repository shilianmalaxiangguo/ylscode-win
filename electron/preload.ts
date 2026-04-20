import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ylsDesktop', {
  noop: async (): Promise<'pong'> => 'pong'
})
