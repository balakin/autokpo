interface Window {
  // Set by src/components/posthog.astro so the inline `window.posthog?.capture(...)`
  // handlers (header, footer, landing page, theme toggle) can reach the instance.
  posthog?: typeof import('posthog-js').default;
}
