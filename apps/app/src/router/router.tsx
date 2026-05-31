import { createBrowserRouter } from 'react-router';

import { appRoutes } from './app-routes';

export function createRouter() {
  return createBrowserRouter(appRoutes);
}

export { appRoutes } from './app-routes';
