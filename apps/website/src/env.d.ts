interface Window {
  // Set by src/components/posthog.astro so the inline `window.posthog?.capture(...)`
  // handlers (header, footer, landing page, theme toggle) can reach the instance.
  posthog?: typeof import('posthog-js').default;
}

// Injected at build time by Vite's `define` in astro.config.ts (the website's
// package.json version).
declare const __APP_VERSION__: string;
