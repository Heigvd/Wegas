/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Schema } from 'jsoninput';
import type {
  IAbstractContentDescriptor,
  IAbstractEntity,
  IVariableDescriptor,
} from 'wegas-ts-api';
import type { AvailableViews } from '../../Editor/Components/FormView';
import type { RootState } from '../store';

/* ------------------------------------------------------------------------- *
 * Types
 *
 * Moved from data/Reducer/editingState.ts so the slice does not import back
 * into data/ (which would close an import cycle through data/actions.ts).
 * ------------------------------------------------------------------------- */

export interface EditionState {
  newEntity?: IAbstractEntity;
  highlight?: boolean;
}

export interface VariableEdition extends EditionState {
  type: 'Variable' | 'VariableFSM';
  entity: IAbstractEntity;
  instanceEditing?: {
    editedInstance?: { instance: IAbstractEntity; saved: boolean };
  };
  config?: Schema<AvailableViews>;
  path?: (string | number)[];
}

export interface VariableCreateEdition extends EditionState {
  type: 'VariableCreate';
  subtype?: 'Choice' | 'Feedback' | 'Comments';
  '@class': IVariableDescriptor['@class'];
  parentId?: number;
  parentType?: string;
  config?: Schema<AvailableViews>;
  path?: (string | number)[];
}

export interface FileEdition extends EditionState {
  type: 'File';
  entity: IAbstractContentDescriptor;
  cb?: (updatedValue: IMergeable) => void;
}

export type Edition = VariableEdition | VariableCreateEdition | FileEdition;

/**
 * What the editor currently has open.
 *
 * A *component-local* edition scope (see store/localEdition.ts) holds this very
 * same shape, so both are reducible by the reducer below.
 */
export interface EditionSliceState {
  current?: Edition;
}

/** Also the initial state of a component-local scope (see store/localEdition). */
export const initialEditionState: EditionSliceState = {};

/**
 * `Variable` and `VariableFSM` are the two editions that carry an entity and an
 * instance editor. Used both as a reducer guard and by components.
 */
export function isEditingVariable(
  edition: Edition | undefined,
): edition is VariableEdition {
  return (
    edition != null &&
    (edition.type === 'Variable' || edition.type === 'VariableFSM')
  );
}

/* ------------------------------------------------------------------------- *
 * Slice
 * ------------------------------------------------------------------------- */

export interface VariableEditPayload {
  entity: IAbstractEntity;
  config?: Schema<AvailableViews>;
  path?: (string | number)[];
}

function startVariableEdition(
  state: EditionSliceState,
  type: VariableEdition['type'],
  payload: VariableEditPayload,
) {
  const previous = state.current;
  state.current = {
    type,
    entity: payload.entity,
    config: payload.config,
    path: payload.path,
    // keep pending changes only when they belong to the entity being (re)opened
    newEntity:
      previous?.newEntity == null || previous.newEntity.id === payload.entity.id
        ? previous?.newEntity
        : undefined,
  };
}

const editionSlice = createSlice({
  name: 'edition',
  initialState: initialEditionState,
  reducers: {
    variableEdit(state, action: PayloadAction<VariableEditPayload>) {
      startVariableEdition(state, 'Variable', action.payload);
    },
    fsmEdit(
      state,
      action: PayloadAction<
        Omit<VariableEditPayload, 'path'> & { path?: string[] }
      >,
    ) {
      startVariableEdition(state, 'VariableFSM', action.payload);
    },
    instanceEditor(state, action: PayloadAction<{ open: boolean }>) {
      const current = state.current;
      if (isEditingVariable(current)) {
        current.instanceEditing = action.payload.open ? {} : undefined;
      }
    },
    instanceEdit(state, action: PayloadAction<{ instance?: IAbstractEntity }>) {
      const current = state.current;
      if (action.payload.instance != null && isEditingVariable(current)) {
        current.instanceEditing = {
          editedInstance: { instance: action.payload.instance, saved: false },
        };
      }
    },
    instanceSave(state) {
      const current = state.current;
      if (
        isEditingVariable(current) &&
        current.instanceEditing?.editedInstance != null
      ) {
        current.instanceEditing.editedInstance.saved = true;
      }
    },
    editionChanges(
      state,
      action: PayloadAction<{ newEntity: IAbstractEntity }>,
    ) {
      if (state.current != null) {
        state.current.newEntity = action.payload.newEntity;
      }
    },
    editionHighlight(state, action: PayloadAction<{ highlight: boolean }>) {
      if (state.current != null) {
        state.current.highlight = action.payload.highlight;
      }
    },
    fileEdit(
      state,
      action: PayloadAction<{
        entity: IAbstractContentDescriptor;
        cb?: (newEntity: IAbstractContentDescriptor) => void;
      }>,
    ) {
      state.current = {
        type: 'File',
        ...action.payload,
        newEntity: undefined,
      };
    },
    variableCreate(
      state,
      action: PayloadAction<{
        '@class': IAbstractEntity['@class'];
        parentId?: number;
        parentType?: string;
        subtype?: VariableCreateEdition['subtype'];
      }>,
    ) {
      state.current = {
        type: 'VariableCreate',
        subtype: action.payload.subtype,
        '@class': action.payload['@class'] as IVariableDescriptor['@class'],
        parentId: action.payload.parentId,
        parentType: action.payload.parentType,
        newEntity: undefined,
      };
    },
    discardUnsavedChanges(state) {
      const current = state.current;
      if (isEditingVariable(current)) {
        current.newEntity = undefined;
      }
    },
    closeEditor(state) {
      state.current = undefined;
    },
  },
});

/* ------------------------------------------------------------------------- *
 * Selectors
 * ------------------------------------------------------------------------- */

/**
 * The current edition.
 *
 * Works for a component-local edition scope too: its dispatch hands thunks a
 * complete RootState with only `edition` swapped for that scope's own (see
 * store/localEdition.ts), so thunks never need to know which scope they run in.
 */
export const selectEdition = (state: RootState) => state.edition.current;

export const {
  variableEdit,
  fsmEdit,
  instanceEditor,
  instanceEdit,
  instanceSave,
  editionChanges,
  editionHighlight,
  fileEdit,
  variableCreate,
  discardUnsavedChanges,
  closeEditor,
} = editionSlice.actions;

export default editionSlice.reducer;
