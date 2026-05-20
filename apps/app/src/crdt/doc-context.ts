import { createContext } from 'react';

import type { TypedDoc } from './typed-doc';

export const DocContext = createContext<TypedDoc | null>(null);
