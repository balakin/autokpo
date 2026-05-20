/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string;
  readonly VITE_SOURCE_URL: string;
}

declare module '*.po' {
  const messages: import('@lingui/core').Messages;
  export { messages };
}
