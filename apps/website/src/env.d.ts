interface Window {
  // Set by src/components/posthog.astro so the inline `window.posthog?.capture(...)`
  // handlers (header, footer, landing page, theme toggle) can reach the instance.
  posthog?: typeof import('posthog-js/dist/module.slim.no-external').default;
}

interface ImportMetaEnv {
  // Injected at build time by Vite's `define` in astro.config.ts (the website's
  // package.json version).
  readonly PUBLIC_APP_VERSION: string;
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
