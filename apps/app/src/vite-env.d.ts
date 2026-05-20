/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string;
}

declare module '*.po' {
  const messages: import('@lingui/core').Messages;
  export { messages };
}
