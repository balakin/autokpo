import { createBrowserRouter } from 'react-router';

import { createAppRoutes } from './app-routes';

export const router = createBrowserRouter(createAppRoutes());

export { createAppRoutes } from './app-routes';
