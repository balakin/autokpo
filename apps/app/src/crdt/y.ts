import * as Y from 'yjs';

import type { TypedDoc, TypedMap } from './typed-doc';

export const YDoc = Y.Doc as unknown as new () => TypedDoc;
export const YMap = Y.Map as unknown as new <
  T extends Record<string, unknown>,
>() => TypedMap<T>;
export const YArray = Y.Array as unknown as new <
  T extends Record<string, unknown>,
>() => Y.Array<TypedMap<T>>;

type AnyDoc = Y.Doc | TypedDoc;

export const encodeStateAsUpdate = Y.encodeStateAsUpdate as (
  doc: AnyDoc,
  encodedTargetStateVector?: Uint8Array,
) => Uint8Array<ArrayBuffer>;

export const encodeStateVector = Y.encodeStateVector as (
  doc: AnyDoc,
) => Uint8Array<ArrayBuffer>;

export const applyUpdate = Y.applyUpdate as (
  doc: AnyDoc,
  update: Uint8Array,
  origin?: unknown,
) => void;
