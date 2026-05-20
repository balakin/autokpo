declare module '*.po' {
  const messages: import('@lingui/core').Messages;
  export { messages };
}
