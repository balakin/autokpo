import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { DocContext } from '../doc-context';
import type { TypedDoc } from '../typed-doc';
import { useYDoc } from '../use-y-doc';

function renderWithDoc<T>(
  doc: TypedDoc,
  selector: (d: TypedDoc) => T,
  isEqual?: (a: T, b: T) => boolean,
) {
  let renderCount = 0;

  function Harness() {
    renderCount++;
    const value = useYDoc(selector, isEqual);
    return <span data-testid="value">{JSON.stringify(value)}</span>;
  }

  render(
    <DocContext value={doc}>
      <Harness />
    </DocContext>,
  );

  return {
    getRenderCount: () => renderCount,
    getValue: () => screen.getByTestId('value').textContent ?? '',
  };
}

function makeDoc(): TypedDoc {
  return new Y.Doc() as unknown as TypedDoc;
}

describe('useYDoc', () => {
  it('returns the selector result on initial render', () => {
    const doc = makeDoc();
    doc.transact(() => {
      doc.getMap('meta').set('schemaVersion', 42);
    });

    const { getValue } = renderWithDoc(doc, (d) =>
      d.getMap('meta').get('schemaVersion'),
    );

    expect(getValue()).toBe('42');
  });

  it('re-renders when the selected slice changes', () => {
    const doc = makeDoc();
    const { getValue, getRenderCount } = renderWithDoc(
      doc,
      (d) => d.getMap('meta').get('schemaVersion') ?? 0,
      Object.is,
    );

    expect(getValue()).toBe('0');
    // eslint-disable-next-line testing-library/render-result-naming-convention
    const renderCountBefore = getRenderCount();

    act(() => {
      doc.transact(() => {
        doc.getMap('meta').set('schemaVersion', 99);
      });
    });

    expect(getValue()).toBe('99');
    expect(getRenderCount()).toBeGreaterThan(renderCountBefore);
  });

  it('defaults to shallowEqual when isEqual is omitted', () => {
    const doc = makeDoc();
    doc.transact(() => {
      doc.getMap('user').set('locale', 'en');
      doc.getMap('meta').set('schemaVersion', 0);
    });

    // Selector returns an object derived from user.locale — not schemaVersion.
    // When only an unrelated field changes, shallow-equal should prevent a re-render.
    const { getRenderCount } = renderWithDoc(doc, (d) => ({
      locale: d.getMap('user').get('locale'),
    }));

    // eslint-disable-next-line testing-library/render-result-naming-convention
    const rendersBefore = getRenderCount();

    act(() => {
      // Change a field the selector doesn't read — should not re-render.
      doc.transact(() => {
        doc.getMap('meta').set('schemaVersion', 1);
      });
    });

    expect(getRenderCount()).toBe(rendersBefore);
  });

  it('supports overriding default equality', () => {
    const doc = makeDoc();
    doc.transact(() => {
      doc.getMap('user').set('locale', 'en');
      doc.getMap('meta').set('schemaVersion', 0);
    });

    const { getRenderCount } = renderWithDoc(
      doc,
      (d) => ({ locale: d.getMap('user').get('locale') }),
      Object.is,
    );

    // eslint-disable-next-line testing-library/render-result-naming-convention
    const rendersBefore = getRenderCount();

    act(() => {
      doc.transact(() => {
        doc.getMap('meta').set('schemaVersion', 1);
      });
    });

    expect(getRenderCount()).toBeGreaterThan(rendersBefore);
  });

  it('afterTransaction batches multiple writes into one render', () => {
    const doc = makeDoc();
    const renderCountRef = { v: 0 };

    function Counter() {
      renderCountRef.v++;
      const count = useYDoc(
        (d) => d.getMap('meta').get('schemaVersion') ?? 0,
        Object.is,
      );
      return <span data-testid="count">{count}</span>;
    }

    render(
      <DocContext value={doc}>
        <Counter />
      </DocContext>,
    );

    const before = renderCountRef.v;

    act(() => {
      // One transaction with multiple writes fires afterTransaction once.
      doc.transact(() => {
        doc.getMap('meta').set('schemaVersion', 1);
        doc.getMap('user').set('locale', 'en');
      });
    });

    // The selector only reads 'schemaVersion', so one transaction → one re-render.
    expect(renderCountRef.v).toBe(before + 1);
    expect(screen.getByTestId('count').textContent).toBe('1');
  });
});
