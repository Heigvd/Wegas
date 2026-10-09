/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { castDraft } from 'immer';
import type { IScript, WegasClassNames } from 'wegas-ts-api';
import { commonServerMethods } from '../../data/methods/CommonServerMethods';
import type { WegasMethodParameter } from '../../Editor/editionConfig';
import type { RootState } from '../store';

/**
 * What client scripts register for the editor and for other scripts, through
 * the scripting API (ClientMethods, ServerMethods, Schemas, Editor.setPageLoader)
 * and the PageLoader component.
 *
 * NOT serializable: client methods and schemas are functions. The slice is
 * exempted from RTK's dev checks in store/store.ts.
 */
export interface ScriptRegistryState {
  clientMethods: {
    [name: string]: Omit<ClientMethodPayload, 'name'>;
  };
  /** server methods offered in the wysiwyg script editor, nested by object */
  serverMethods: ServerGlobalObject;
  serverVariableMethods: ServerVariableMethods;
  /** custom form views for entities (Schemas.addSchema) */
  schemas: {
    /** entity class -> the schema name used for every entity of that class */
    filtered: { [classFilter: string]: string };
    /** schemas that decide themselves which entities they apply to */
    unfiltered: string[];
    views: { [name: string]: CustomSchemaFN };
  };
  /** page loader name -> script returning the page id to show in it */
  pageLoaders: { [name: string]: IScript };
}

const initialState: ScriptRegistryState = {
  clientMethods: {},
  serverMethods: { ...commonServerMethods },
  serverVariableMethods: {},
  schemas: {
    filtered: {},
    unfiltered: [],
    views: {},
  },
  pageLoaders: {},
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export function isServerMethod(
  serverObject: ServerGlobalMethod | ServerGlobalObject | undefined,
): serverObject is ServerGlobalMethod {
  return (
    typeof serverObject === 'object' &&
    '@class' in serverObject &&
    serverObject['@class'] === 'ServerGlobalMethod'
  );
}

/**
 * Typescript declarations of the registered server methods, for the script
 * editor's type checking.
 */
export function buildGlobalServerMethods(
  serverObject: ServerGlobalObject,
): string {
  return Object.entries(serverObject)
    .filter(([, value]) => value != null)
    .reduce((old, [key, value], i, objects) => {
      if (value == null) {
        return old + '';
      } else if (isServerMethod(value)) {
        return (
          old +
          '\n\t' +
          `${key}: (${(value.parameters as WegasMethodParameter[])
            .map((p, i) => `arg${i}${p.required ? '' : '?'}: ${p.type}`)
            .join(', ')}) => ${value.returns ? value.returns : 'void'};${
            i === objects.length - 1 ? '\n' : ''
          }`
        );
      } else {
        return (
          old +
          (i > 0 ? '\n' : '') +
          `declare const ${key}: {${buildGlobalServerMethods(value)}}`
        );
      }
    }, '');
}

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const scriptRegistrySlice = createSlice({
  name: 'scriptRegistry',
  initialState,
  reducers: {
    clientMethodSet(state, action: PayloadAction<ClientMethodPayload>) {
      const { name, ...method } = action.payload;
      // `parameters` is a readonly tuple, which immer's draft type rejects
      state.clientMethods[name] = castDraft(method);
    },
    /**
     * Stores the method under its objects path, e.g. ["PMGHelper",
     * "MailMethods"] + "send" -> serverMethods.PMGHelper.MailMethods.send.
     * A method found on the way is replaced by an object.
     */
    serverGlobalMethodRegistered(
      state,
      action: PayloadAction<ServerGlobalMethodPayload>,
    ) {
      const { objects, method, schema } = action.payload;
      let parent = state.serverMethods;
      for (const key of objects) {
        const child = parent[key];
        if (child == null || isServerMethod(child)) {
          parent[key] = {};
        }
        parent = parent[key] as ServerGlobalObject;
      }
      parent[method] = schema;
    },
    serverVariableMethodRegistered(
      state,
      action: PayloadAction<ServerVariableMethodPayload>,
    ) {
      const { variableClass, label, ...method } = action.payload;
      // The first method of a class creates its entry (it used to throw)
      if (state.serverVariableMethods[variableClass] == null) {
        state.serverVariableMethods[variableClass] = {};
      }
      state.serverVariableMethods[variableClass][label] = method;
    },
    /**
     * Sets, replaces (same name) or, without schemaFN, removes a custom schema.
     */
    schemaSet(
      state,
      action: PayloadAction<{
        name: string;
        schemaFN?: CustomSchemaFN;
        simpleFilter?: WegasClassNames;
      }>,
    ) {
      const { name, schemaFN, simpleFilter } = action.payload;
      const schemas = state.schemas;

      // Always remove the previous schema with the same name
      delete schemas.views[name];
      for (const classFilter of Object.keys(schemas.filtered)) {
        if (schemas.filtered[classFilter] === name) {
          delete schemas.filtered[classFilter];
        }
      }
      schemas.unfiltered = schemas.unfiltered.filter(s => s !== name);

      if (schemaFN !== undefined) {
        schemas.views[name] = schemaFN;
        // A simple filter maps the schema to every entity of that class
        if (simpleFilter !== undefined) {
          schemas.filtered[simpleFilter] = name;
        } else {
          schemas.unfiltered.push(name);
        }
      }
    },
    pageLoaderRegistered(
      state,
      action: PayloadAction<{ name: string; pageId: IScript }>,
    ) {
      state.pageLoaders[action.payload.name] = action.payload.pageId;
    },
    pageLoadersReset(state) {
      state.pageLoaders = {};
    },
  },
});

export const {
  clientMethodSet,
  serverGlobalMethodRegistered,
  serverVariableMethodRegistered,
  schemaSet,
  pageLoaderRegistered,
  pageLoadersReset,
} = scriptRegistrySlice.actions;
export default scriptRegistrySlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectScriptRegistry = (s: RootState): ScriptRegistryState =>
  s.scriptRegistry;

export const selectClientMethods = (
  s: RootState,
): ScriptRegistryState['clientMethods'] => s.scriptRegistry.clientMethods;

export const selectServerMethods = (s: RootState): ServerGlobalObject =>
  s.scriptRegistry.serverMethods;

export const selectCustomSchemas = (
  s: RootState,
): ScriptRegistryState['schemas'] => s.scriptRegistry.schemas;

export const selectPageLoaders = (
  s: RootState,
): ScriptRegistryState['pageLoaders'] => s.scriptRegistry.pageLoaders;