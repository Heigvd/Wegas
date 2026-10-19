/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { AnyAction } from '@reduxjs/toolkit';
import type { IScript } from 'wegas-ts-api';
import reducer, {
  buildGlobalServerMethods,
  clientMethodSet,
  pageLoaderRegistered,
  pageLoadersReset,
  schemaSet,
  serverGlobalMethodRegistered,
  serverVariableMethodRegistered,
} from './scriptRegistry';

const initial = () => reducer(undefined, { type: 'unrelated/action' });

/** The state after dispatching the actions in order. */
const apply = (...actions: AnyAction[]) =>
  actions.reduce((state, action) => reducer(state, action), initial());

const sendMail: ServerGlobalMethod = {
  '@class': 'ServerGlobalMethod',
  label: 'Send mail',
  parameters: [{ type: 'string', required: true }],
};

const script = (content: string) =>
  ({ '@class': 'Script', language: 'JavaScript', content } as IScript);

const schemaFN: CustomSchemaFN = () => undefined;

describe('scriptRegistry slice', () => {
  it('starts with the common server methods only', () => {
    const s = initial();

    expect(Object.keys(s.serverMethods)).toContain('RequestManager');
    expect(s.clientMethods).toEqual({});
    expect(s.serverVariableMethods).toEqual({});
    expect(s.pageLoaders).toEqual({});
    expect(s.schemas).toEqual({ filtered: {}, unfiltered: [], views: {} });
  });

  describe('client methods', () => {
    it('stores a method under its name, without the name', () => {
      const method = () => 1;
      const s = reducer(
        initial(),
        clientMethodSet({
          name: 'getScore',
          parameters: [],
          returnTypes: ['number'],
          returnStyle: 'single',
          method,
        }),
      );

      expect(s.clientMethods.getScore).toEqual({
        parameters: [],
        returnTypes: ['number'],
        returnStyle: 'single',
        method,
      });
    });
  });

  describe('server global methods', () => {
    it('stores a method under its nested objects path', () => {
      const s = reducer(
        initial(),
        serverGlobalMethodRegistered({
          objects: ['PMGHelper', 'MailMethods'],
          method: 'send',
          schema: sendMail,
        }),
      );

      expect(s.serverMethods.PMGHelper).toEqual({
        MailMethods: { send: sendMail },
      });
    });

    it('keeps sibling methods of the same object', () => {
      const s = apply(
        serverGlobalMethodRegistered({
          objects: ['PMGHelper'],
          method: 'a',
          schema: sendMail,
        }),
        serverGlobalMethodRegistered({
          objects: ['PMGHelper'],
          method: 'b',
          schema: sendMail,
        }),
      );

      expect(s.serverMethods.PMGHelper).toEqual({ a: sendMail, b: sendMail });
    });

    it('replaces a method met on the way by an object', () => {
      const s = apply(
        serverGlobalMethodRegistered({
          objects: ['Helper'],
          method: 'tools',
          schema: sendMail,
        }),
        serverGlobalMethodRegistered({
          objects: ['Helper', 'tools'],
          method: 'send',
          schema: sendMail,
        }),
      );

      expect(s.serverMethods.Helper).toEqual({ tools: { send: sendMail } });
    });

    it('does not mutate the action payload (the old reducer emptied it)', () => {
      const objects: [string, ...string[]] = ['PMGHelper', 'MailMethods'];
      reducer(
        initial(),
        serverGlobalMethodRegistered({ objects, method: 'send', schema: sendMail }),
      );

      expect(objects).toEqual(['PMGHelper', 'MailMethods']);
    });

    it('generates the typescript declarations', () => {
      const s = reducer(
        initial(),
        serverGlobalMethodRegistered({
          objects: ['PMGHelper'],
          method: 'send',
          schema: { ...sendMail, returns: 'boolean' },
        }),
      );

      expect(
        buildGlobalServerMethods({ PMGHelper: s.serverMethods.PMGHelper }),
      ).toBe('declare const PMGHelper: {\n\tsend: (arg0: string) => boolean;\n}');
    });
  });

  describe('server variable methods', () => {
    it('creates the class entry on its first method (the old reducer threw)', () => {
      const s = reducer(
        initial(),
        serverVariableMethodRegistered({
          variableClass: 'NumberDescriptor',
          label: 'Double it',
          parameters: [],
          returns: 'number',
          serverCode: 'x * 2',
        }),
      );

      expect(s.serverVariableMethods).toEqual({
        NumberDescriptor: {
          'Double it': { parameters: [], returns: 'number', serverCode: 'x * 2' },
        },
      });
    });
  });

  describe('schemas', () => {
    it('maps a filtered schema to its class', () => {
      const s = reducer(
        initial(),
        schemaSet({ name: 'myView', schemaFN, simpleFilter: 'NumberDescriptor' }),
      );

      expect(s.schemas).toEqual({
        filtered: { NumberDescriptor: 'myView' },
        unfiltered: [],
        views: { myView: schemaFN },
      });
    });

    it('lists an unfiltered schema', () => {
      const s = reducer(initial(), schemaSet({ name: 'myView', schemaFN }));

      expect(s.schemas.unfiltered).toEqual(['myView']);
    });

    it('replaces a schema with the same name, filter included', () => {
      const s = apply(
        schemaSet({ name: 'myView', schemaFN, simpleFilter: 'NumberDescriptor' }),
        schemaSet({ name: 'myView', schemaFN }),
      );

      expect(s.schemas).toEqual({
        filtered: {},
        unfiltered: ['myView'],
        views: { myView: schemaFN },
      });
    });

    it('removes a schema when given no function', () => {
      const s = apply(
        schemaSet({ name: 'myView', schemaFN, simpleFilter: 'NumberDescriptor' }),
        schemaSet({ name: 'myView' }),
      );

      expect(s.schemas).toEqual({ filtered: {}, unfiltered: [], views: {} });
    });
  });

  describe('page loaders', () => {
    it('registers, replaces and resets page loaders', () => {
      const registered = apply(
        pageLoaderRegistered({ name: 'main', pageId: script('"1"') }),
        pageLoaderRegistered({ name: 'main', pageId: script('"2"') }),
        pageLoaderRegistered({ name: 'side', pageId: script('"3"') }),
      );

      expect(registered.pageLoaders).toEqual({
        main: script('"2"'),
        side: script('"3"'),
      });
      expect(reducer(registered, pageLoadersReset()).pageLoaders).toEqual({});
    });
  });
});