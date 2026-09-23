/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * The two slices that replaced the old editingStore.
 *
 * The tests build a store from the two reducers with the same middleware options
 * as store/store.ts rather than importing it: the real store pulls in the
 * old-store graph and wegas-ts-api, which ships untranspiled ESM that jest is
 * not set up for. tsc covers the real reducer-map composition.
 */
import { configureStore } from '@reduxjs/toolkit';
import editionReducer, {
  closeEditor,
  initialEditionState,
  editionChanges,
  fsmEdit,
  instanceEdit,
  instanceEditor,
  instanceSave,
  variableCreate,
  variableEdit,
} from './slices/edition';
import editorEventsReducer, {
  editorEventAdded,
  editorEventRead,
  editorEventRemoved,
} from './slices/editorEvents';
import { managedResponseReceived } from './actions';

function makeStore() {
  return configureStore({
    reducer: { edition: editionReducer, editorEvents: editorEventsReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ['edition', 'editorEvents'],
          ignoredActionPaths: [
            'payload.config',
            'payload.cb',
            'payload.entity',
            'payload.instance',
            'payload.newEntity',
            'payload.events',
            'payload.updatedEntities',
            'payload.deletedEntities',
          ],
        },
        immutableCheck: { ignoredPaths: ['edition', 'editorEvents'] },
      }),
  });
}

const ev = (timestamp: number) =>
  ({
    '@class': 'ClientEvent',
    error: 'boom',
    timestamp,
    unread: true,
  } as unknown as WegasEvent);

describe('edition slice', () => {
  it('starts empty', () => {
    expect(makeStore().getState().edition).toEqual({});
  });

  it('opens a variable edition', () => {
    const store = makeStore();
    const entity = { '@class': 'NumberDescriptor', id: 42 } as never;
    store.dispatch(variableEdit({ entity, path: ['a'] }));
    expect(store.getState().edition.current).toMatchObject({
      type: 'Variable',
      entity,
      path: ['a'],
      newEntity: undefined,
    });
  });

  it('keeps newEntity for the same entity and drops it for another', () => {
    const store = makeStore();
    const entity = { '@class': 'NumberDescriptor', id: 42 } as never;
    store.dispatch(variableEdit({ entity }));
    store.dispatch(editionChanges({ newEntity: { id: 42 } as never }));

    store.dispatch(variableEdit({ entity }));
    expect(store.getState().edition.current!.newEntity).toEqual({ id: 42 });

    store.dispatch(variableEdit({ entity: { '@class': 'X', id: 43 } as never }));
    expect(store.getState().edition.current!.newEntity).toBeUndefined();
  });

  it('ignores instance actions on a non-variable edition', () => {
    const store = makeStore();
    store.dispatch(variableCreate({ '@class': 'NumberDescriptor' as never }));
    store.dispatch(instanceEditor({ open: true }));
    store.dispatch(instanceEdit({ instance: { id: 1 } as never }));
    store.dispatch(instanceSave());
    expect(store.getState().edition.current).not.toHaveProperty(
      'instanceEditing',
    );
  });

  it('runs the instance editor on a VariableFSM edition', () => {
    const store = makeStore();
    store.dispatch(
      fsmEdit({ entity: { '@class': 'FSMDescriptor', id: 7 } as never }),
    );
    store.dispatch(instanceEditor({ open: true }));
    store.dispatch(instanceEdit({ instance: { id: 99 } as never }));
    store.dispatch(instanceSave());
    expect(store.getState().edition.current).toMatchObject({
      type: 'VariableFSM',
      instanceEditing: { editedInstance: { instance: { id: 99 }, saved: true } },
    });

    store.dispatch(instanceEditor({ open: false }));
    expect(store.getState().edition.current).toMatchObject({
      instanceEditing: undefined,
    });

    store.dispatch(closeEditor());
    expect(store.getState().edition.current).toBeUndefined();
  });
});

describe('edition reducer driven standalone (as useLocalEdition does)', () => {
  // useLocalEdition runs this very reducer through React.useReducer. A thunk
  // dispatched into a local scope routes its inner plain actions there too, so
  // the reducer must return the *same* state object for anything it does not
  // handle -- otherwise every managed response would re-render the nested form.
  it('returns the identical state for unhandled actions', () => {
    const opened = editionReducer(
      initialEditionState,
      variableEdit({ entity: { '@class': 'NumberDescriptor', id: 5 } as never }),
    );
    expect(opened.current).toBeDefined();

    for (const action of [
      { type: 'MANAGED_RESPONSE_ACTION', payload: { events: [] } },
      { type: 'editorEvents/editorEventAdded', payload: ev(1) },
      { type: 'initStatuses/setInitStatus', payload: { key: 'games' } },
      { type: '@@redux/INIT' },
    ]) {
      expect(editionReducer(opened, action as never)).toBe(opened);
    }
  });

  it('seeds from initialEditionState without mutating it', () => {
    expect(initialEditionState).toEqual({});
    editionReducer(
      initialEditionState,
      variableEdit({ entity: { '@class': 'X', id: 1 } as never }),
    );
    expect(initialEditionState).toEqual({});
  });
});

describe('editorEvents slice', () => {
  it('adds, reads and removes events', () => {
    const store = makeStore();
    store.dispatch(editorEventAdded(ev(100)));
    store.dispatch(editorEventAdded(ev(200)));
    const before = store.getState().editorEvents.events;

    store.dispatch(editorEventRead({ timestamp: 100 }));
    const after = store.getState().editorEvents.events;
    expect(after[0].unread).toBe(false);
    expect(after[1].unread).toBe(true);
    // immer gives us the fresh references the old reducer faked with cloneDeep
    expect(after).not.toBe(before);
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).toBe(before[1]); // untouched event is shared

    store.dispatch(editorEventRead({ timestamp: 999 })); // unknown timestamp
    expect(store.getState().editorEvents.events).toBe(after);

    store.dispatch(editorEventRemoved({ timestamp: 100 }));
    expect(
      store.getState().editorEvents.events.map(e => e.timestamp),
    ).toEqual([200]);
    store.dispatch(editorEventRemoved({ timestamp: 999 })); // unknown timestamp
    expect(
      store.getState().editorEvents.events.map(e => e.timestamp),
    ).toEqual([200]);
  });

  it('appends the events of a managed response, and nothing when empty', () => {
    const store = makeStore();
    const entities = { variableDescriptors: {} } as never;
    store.dispatch(
      managedResponseReceived({
        updatedEntities: entities,
        deletedEntities: entities,
        events: [ev(300)],
      }),
    );
    expect(
      store.getState().editorEvents.events.map(e => e.timestamp),
    ).toEqual([300]);

    const before = store.getState().editorEvents.events;
    store.dispatch(
      managedResponseReceived({
        updatedEntities: entities,
        deletedEntities: entities,
        events: [],
      }),
    );
    expect(store.getState().editorEvents.events).toBe(before);
  });
});

describe('middleware configuration', () => {
  it('does not warn about the non-serialisable edition payloads', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      const store = makeStore();
      // a jsoninput schema (functions inside) and a FileEdition callback
      store.dispatch(
        variableEdit({
          entity: { '@class': 'NumberDescriptor', id: 1 } as never,
          config: { view: { fn: () => undefined } } as never,
        }),
      );
      store.dispatch(editorEventAdded(ev(1)));
      const messages = [...warn.mock.calls, ...error.mock.calls].map(c =>
        String(c[0]),
      );
      expect(
        messages.filter(m => /non-serializable|mutat/i.test(m)),
      ).toEqual([]);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });
});
