/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { RootState } from '../store';
import reducer, {
  PageContextState,
  selectIsReloading,
  selectLivePageContext,
  selectPublishedPageContext,
  setContextValue,
  setReloading,
  setStateValue,
} from './pageContext';

/**
 * `RootState` is imported as a *type only*, so this spec never loads the store
 * module (and none of the app it drags in). The cast is the price.
 */
const wrap = (pageContext: PageContextState) =>
  ({ pageContext } as unknown as RootState);

const published = (s: PageContextState) => selectPublishedPageContext(wrap(s));
const live = (s: PageContextState) => selectLivePageContext(wrap(s));
const reloading = (s: PageContextState) => selectIsReloading(wrap(s));

describe('pageContext slice', () => {
  it('starts empty, not reloading, published === live', () => {
    const s = reducer(undefined, { type: 'unrelated/action' });

    expect(s.values).toEqual({ context: {}, state: {} });
    expect(s.frozen).toBeUndefined();
    expect(reloading(s)).toBe(false);
    expect(published(s)).toBe(live(s));
  });

  it('wraps written values in { state: value } -- the scripting API shape', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 0 }));
    s = reducer(s, setStateValue({ exposeAs: 'state_0', value: 'hello' }));

    // `Context.foo.state` is how a client script reads it
    expect(live(s).context.foo).toEqual({ state: 0 });
    expect(live(s).state.state_0).toEqual({ state: 'hello' });
  });

  it('keeps the two maps independent', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 1 }));
    s = reducer(s, setStateValue({ exposeAs: 'foo', value: 2 }));

    expect(live(s).context.foo).toEqual({ state: 1 });
    expect(live(s).state.foo).toEqual({ state: 2 });
  });

  it('accepts any script value, including functions', () => {
    const fn = () => 'whatever';
    const s = reducer(undefined, setContextValue({ exposeAs: 'f', value: fn }));

    expect(live(s).context.f).toEqual({ state: fn });
  });

  /* ---------------------------------------------------------------- *
   * The reload window -- the reason this slice is shaped this way
   * ---------------------------------------------------------------- */

  it('captures the live values when the reload window opens', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 1 }));
    const before = published(s);

    s = reducer(s, setReloading(true));

    // the capture aliases rather than copies: no new object
    expect(s.frozen).toBe(s.values);
    expect(published(s)).toBe(before);
    expect(reloading(s)).toBe(true);
  });

  it('freezes the published view for the whole window while live advances', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 1 }));
    const before = published(s);

    s = reducer(s, setReloading(true));
    s = reducer(s, setStateValue({ exposeAs: 'state_0', value: 'x' }));
    s = reducer(s, setContextValue({ exposeAs: 'foo', value: 2 }));
    s = reducer(s, setContextValue({ exposeAs: 'bar', value: 9 }));

    // Same *reference* throughout: this is what keeps consumers from
    // re-rendering, and therefore from re-evaluating their scripts, mid-reload.
    expect(published(s)).toBe(before);
    expect(published(s).context.foo).toEqual({ state: 1 });
    expect(published(s).context.bar).toBeUndefined();

    // ... while the live view, which client-library evaluation reads, advances
    expect(live(s).context.foo).toEqual({ state: 2 });
    expect(live(s).context.bar).toEqual({ state: 9 });
    expect(live(s).state.state_0).toEqual({ state: 'x' });
  });

  it('does not re-capture on a reentrant setReloading(true)', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 1 }));
    const before = published(s);

    s = reducer(s, setReloading(true));
    s = reducer(s, setContextValue({ exposeAs: 'foo', value: 2 }));
    s = reducer(s, setReloading(true));

    // a second open must not replace the snapshot with half-rebuilt values
    expect(published(s)).toBe(before);
    expect(published(s).context.foo).toEqual({ state: 1 });
  });

  it('releases to the rebuilt values when the window closes', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 1 }));

    s = reducer(s, setReloading(true));
    s = reducer(s, setContextValue({ exposeAs: 'foo', value: 2 }));
    s = reducer(s, setReloading(false));

    expect(s.frozen).toBeUndefined();
    expect(reloading(s)).toBe(false);
    expect(published(s)).toBe(live(s));
    // every write made inside the window is visible afterwards
    expect(published(s).context.foo).toEqual({ state: 2 });
  });

  it('leaves the published reference untouched across an empty window', () => {
    let s = reducer(undefined, setContextValue({ exposeAs: 'foo', value: 1 }));
    const before = published(s);

    s = reducer(s, setReloading(true));
    s = reducer(s, setReloading(false));

    // A library save that changes nothing must not re-render a single consumer.
    // Holds only because the capture aliases instead of copying.
    expect(published(s)).toBe(before);
  });

  it('survives repeated open/close cycles', () => {
    let s = reducer(undefined, { type: 'init' });

    for (let i = 0; i < 3; i++) {
      s = reducer(s, setReloading(true));
      s = reducer(s, setStateValue({ exposeAs: `state_${i}`, value: i }));
      s = reducer(s, setReloading(false));
      expect(reloading(s)).toBe(false);
      expect(published(s)).toBe(live(s));
      expect(published(s).state[`state_${i}`]).toEqual({ state: i });
    }

    // NB: keys accumulate -- every reload allocates fresh `state_N` names and
    // abandons the previous ones. See doc/pageContextStore-migration.md 4.2.
    expect(Object.keys(live(s).state)).toEqual([
      'state_0',
      'state_1',
      'state_2',
    ]);
  });
});
