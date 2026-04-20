export {}

declare global {
  interface Window {
    ylsDesktop: {
      noop: () => Promise<'pong'>
    }
  }
}
