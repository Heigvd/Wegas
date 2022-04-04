import { Immutable, produce } from 'immer';
import { Schema } from 'jsoninput';
import { cloneDeep } from 'lodash-es';
import {
  IAbstractContentDescriptor,
  IAbstractEntity,
  IAbstractState,
  IAbstractStateMachineDescriptor,
  IAbstractTransition,
  IChoiceDescriptor,
  IDialogueDescriptor,
  IFSMDescriptor,
  IListDescriptor,
  IPeerReviewDescriptor,
  IQuestionDescriptor,
  IVariableDescriptor,
  IWhQuestionDescriptor,
} from 'wegas-ts-api';
import { Actions as ACTIONS, Actions } from '..';
import { FileAPI } from '../../API/files.api';
import { AvailableViews } from '../../Editor/Components/FormView';
import { triggerEventHandlers } from '../actions';
import { ActionType, ActionTypeValues } from '../actionTypes';
import { entityIsPersisted } from '../entities';
import { NormalizedData } from '../normalize';
import { VariableDescriptor } from '../selectors';
import { editingStore, EditingThunkResult } from '../Stores/editingStore';
import { store } from '../Stores/store';

export interface ActionsProps<T> {
  action: (entity: T, path?: (string | number)[]) => void;
  label: React.ReactNode;
  confirm?: boolean;
  sorting: 'delete' | 'duplicate' | 'toolbox' | 'close' | 'findUsage';
}

export interface EditorAction<T extends IAbstractEntity> {
  save?: (entity: T, selectUpdatedEntity?: boolean) => void;
  more?: {
    [id: string]: ActionsProps<T>;
  };
}

function createAction<T extends ActionTypeValues, P>(type: T, payload: P) {
  return {
    type,
    payload,
  };
}
const variableEditAction =
  <TA extends ActionTypeValues>(type: TA) =>
  <TE extends IAbstractEntity>(data: {
    entity: TE;
    config?: Schema<AvailableViews>;
    path?: TA extends ValueOf<typeof ActionType.FSM_EDIT>
      ? string[]
      : (string | number)[];
    actions: EditorAction<TE>;
  }) =>
    createAction(type, data);

/**
 * Simple action creators.
 */
export const EditingActionCreator = {
  EDITOR_EVENT_REMOVE: (data: { timestamp: number }) =>
    createAction(ActionType.EDITOR_EVENT_REMOVE, data),
  EDITOR_EVENT_READ: (data: { timestamp: number }) =>
    createAction(ActionType.EDITOR_EVENT_READ, data),
  EDITOR_EVENT: (data: WegasEvent) =>
    createAction(ActionType.EDITOR_EVENT, data),
  VARIABLE_EDIT: variableEditAction(ActionType.VARIABLE_EDIT),
  FSM_EDIT: variableEditAction(ActionType.FSM_EDIT),
  INSTANCE_EDIT: (data: { instance?: IAbstractEntity }) =>
    createAction(ActionType.INSTANCE_EDIT, data),
  INSTANCE_SAVE: () => createAction(ActionType.INSTANCE_SAVE, {}),
  INSTANCE_EDITOR: (data: { open: boolean }) =>
    createAction(ActionType.INSTANCE_EDITOR, data),
  EDITION_CHANGES: (data: { newEntity: IAbstractEntity }) =>
    createAction(ActionType.EDITION_CHANGES, data),
  EDITION_HIGHLIGHT: (data: { highlight: boolean }) =>
    createAction(ActionType.EDITION_HIGHLIGHT, data),
  FILE_EDIT: (data: {
    entity: IAbstractContentDescriptor;
    cb?: (newEntity: IAbstractContentDescriptor) => void;
  }) => createAction(ActionType.FILE_EDIT, data),
  VARIABLE_CREATE: <T extends IAbstractEntity>(data: {
    '@class': IAbstractEntity['@class'];
    parentId?: number;
    parentType?: string;
    actions: {
      save?: (entity: T) => void;
      delete?: (entity: T) => void;
    };
  }) => createAction(ActionType.VARIABLE_CREATE, data),

  CLOSE_EDITOR: () => createAction(ActionType.CLOSE_EDITOR, {}),
  DISCARD_UNSAVED_CHANGES: () =>
    createAction(ActionType.DISCARD_UNSAVED_CHANGES, {}),

  MANAGED_RESPONSE_ACTION: (data: {
    // Nearly empty shells
    deletedEntities: {
      [K in keyof NormalizedData]: { [id: string]: IAbstractEntity };
    };
    updatedEntities: NormalizedData;
    events: WegasEvent[];
  }) => createAction(ActionType.MANAGED_RESPONSE_ACTION, data),
};

export type EditingStateActions<
  A extends keyof typeof EditingActionCreator = keyof typeof EditingActionCreator,
> = ReturnType<typeof EditingActionCreator[A]>;

export interface ActionsProps<T> {
  action: (entity: T, path?: (string | number)[]) => void;
  label: React.ReactNode;
  confirm?: boolean;
  sorting: 'delete' | 'duplicate' | 'toolbox' | 'close' | 'findUsage';
}

export interface EditorAction<T extends IAbstractEntity> {
  save?: (entity: T, selectUpdatedEntity?: boolean) => void;
  more?: {
    [id: string]: ActionsProps<T>;
  };
}

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
  actions: EditorAction<IAbstractEntity>;
}

export interface VariableCreateEdition extends EditionState {
  type: 'VariableCreate';
  '@class': IVariableDescriptor['@class'];
  parentId?: number;
  parentType?: string;
  config?: Schema<AvailableViews>;
  actions: EditorAction<IAbstractEntity>;
}

export interface ComponentEdition extends EditionState {
  type: 'Component';
  page: string;
  path: (string | number)[];
  config?: Schema<AvailableViews>;
  actions: EditorAction<IAbstractEntity>;
}

export interface FileEdition extends EditionState {
  type: 'File';
  entity: IAbstractContentDescriptor;
  cb?: (updatedValue: IMergeable) => void;
}

export type Edition =
  | VariableEdition
  | VariableCreateEdition
  | ComponentEdition
  | FileEdition;

export interface EditingState {
  editing?: Edition;
  events: WegasEvent[];
}

/**
 *
 * @param state
 * @param action
 */
export function eventManagement(
  state: EditingState,
  action: EditingStateActions,
): WegasEvent[] {
  switch (action.type) {
    case ActionType.MANAGED_RESPONSE_ACTION:
      return [...state.events, ...action.payload.events];
    case ActionType.EDITOR_EVENT_REMOVE: {
      const newEvents = [...state.events];
      const indexOfRemoved = newEvents.findIndex(
        e => e.timestamp === action.payload.timestamp,
      );
      if (indexOfRemoved !== -1) {
        newEvents.splice(indexOfRemoved, 1);
      }
      return newEvents;
    }
    case ActionType.EDITOR_EVENT_READ: {
      const readEventIndex = state.events.findIndex(
        e => e.timestamp === action.payload.timestamp,
      );
      if (readEventIndex !== -1) {
        const event = cloneDeep(state.events[readEventIndex]);
        const before = state.events.slice(0, readEventIndex);
        const after = state.events.slice(readEventIndex + 1);
        const ret = [...before, { ...event, unread: false }, ...after];
        return ret;
      } else {
        return state.events;
      }
    }
    case ActionType.EDITOR_EVENT:
      return [...state.events, action.payload];
    default:
      return state.events;
  }
}

/**
 *  This is a separate switch-case only for editor actions management
 * @param state
 * @param action
 */
export function editorManagement(
  state: EditingState,
  action: EditingStateActions,
): Edition | undefined {
  switch (action.type) {
    case ActionType.VARIABLE_EDIT:
    case ActionType.FSM_EDIT:
      return {
        type:
          action.type === ActionType.VARIABLE_EDIT ? 'Variable' : 'VariableFSM',
        entity: action.payload.entity,
        config: action.payload.config,
        path: action.payload.path,
        actions: action.payload.actions,
        newEntity:
          state.editing?.newEntity == null ||
          state.editing?.newEntity?.id === action.payload.entity.id
            ? state.editing?.newEntity
            : undefined,
      };
    case ActionType.INSTANCE_EDITOR:
      if (
        state.editing?.type === 'Variable' ||
        state.editing?.type === 'VariableFSM'
      ) {
        state.editing.instanceEditing = action.payload.open ? {} : undefined;
      }
      break;
    case ActionType.INSTANCE_EDIT:
      if (
        action.payload.instance != null &&
        (state.editing?.type === 'Variable' ||
          state.editing?.type === 'VariableFSM')
      ) {
        state.editing.instanceEditing = {
          editedInstance: { instance: action.payload.instance, saved: false },
        };
      }
      break;
    case ActionType.INSTANCE_SAVE:
      if (
        (state.editing?.type === 'Variable' ||
          state.editing?.type === 'VariableFSM') &&
        state.editing.instanceEditing?.editedInstance != null
      ) {
        state.editing.instanceEditing.editedInstance.saved = true;
      }
      break;
    case ActionType.EDITION_CHANGES:
      if (state.editing != null) {
        state.editing.newEntity = action.payload.newEntity;
      }
      break;
    case ActionType.EDITION_HIGHLIGHT:
      if (state.editing != null) {
        state.editing.highlight = action.payload.highlight;
      }
      break;

    case ActionType.VARIABLE_CREATE:
      return {
        type: 'VariableCreate',
        '@class': action.payload['@class'] as IVariableDescriptor['@class'],
        parentId: action.payload.parentId,
        parentType: action.payload.parentType,
        actions: action.payload.actions,
        newEntity: undefined,
      };
    case ActionType.FILE_EDIT:
      return {
        type: 'File',
        ...action.payload,
        newEntity: undefined,
      };
    case ActionType.DISCARD_UNSAVED_CHANGES:
      if (
        state.editing?.type === 'Variable' ||
        state.editing?.type === 'VariableFSM'
      ) {
        state.editing.newEntity = undefined;
      }
      break;
    case ActionType.CLOSE_EDITOR:
      return undefined;
  }
  return state.editing;
}

/**
 * Edit VariableDescriptor
 * @param entity
 * @param path
 * @param config
 * @param actions
 */
export function editVariable(
  entity: IVariableDescriptor,
  path: (string | number)[] = [],
  config?: Schema<AvailableViews>,
  actions?: EditorAction<IVariableDescriptor>,
): EditingThunkResult {
  return function (dispatch) {
    const currentActions: EditorAction<IVariableDescriptor> =
      actions != null
        ? actions
        : {
            more: {
              duplicate: {
                label: 'Duplicate',
                sorting: 'duplicate',
                action: (entity: IVariableDescriptor) => {
                  dispatch(
                    Actions.VariableDescriptorActions.duplicateDescriptor(
                      entity,
                    ),
                  );
                },
              },
              delete: {
                label: 'Delete',
                sorting: 'delete',
                action: (entity: IVariableDescriptor, path?: string[]) => {
                  dispatch(
                    Actions.VariableDescriptorActions.deleteDescriptor(
                      entity,
                      path,
                    ),
                  );
                },
                confirm: true,
              },
              findUsage: {
                label: 'Find usage',
                sorting: 'findUsage',
                action: (entity: IVariableDescriptor) => {
                  if (entityIsPersisted(entity) && entity.name != null) {
                    store.dispatch(
                      Actions.EditorActions.searchDeep(entity.name),
                    );
                  }
                },
              },
              Instance: {
                label: 'Instance',
                sorting: 'toolbox',
                action: () =>
                  dispatch(
                    EditingActionCreator.INSTANCE_EDITOR({ open: true }),
                  ),
              },
            },
          };
    dispatch(
      EditingActionCreator.VARIABLE_EDIT({
        entity,
        config,
        path,
        actions: currentActions,
      }),
    );
  };
}

export function deleteState<T extends IFSMDescriptor | IDialogueDescriptor>(
  stateMachine: Immutable<T>,
  id: number,
) {
  const newStateMachine = produce((stateMachine: T) => {
    const { states } = stateMachine;
    delete states[id];
    // delete transitions pointing to deleted state
    for (const s in states) {
      (states[s] as IAbstractState).transitions = (
        states[s].transitions as IAbstractTransition[]
      ).filter(t => t.nextStateId !== id);
    }
  })(stateMachine);

  editingStore.dispatch(
    Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
  );
}

/**
 * Edit StateMachine
 * @param entity
 * @param path
 * @param config
 */
export function editStateMachine(
  entity: Immutable<IAbstractStateMachineDescriptor>,
  path: string[] = [],
  config?: Schema<AvailableViews>,
  actions?: EditorAction<IVariableDescriptor>,
): EditingThunkResult {
  return function (dispatch) {
    dispatch(
      EditingActionCreator.FSM_EDIT({
        entity,
        config,
        path,
        actions: actions || {
          more: {
            delete: {
              label: 'Delete',
              sorting: 'delete',
              confirm: true,
              action: (entity: IFSMDescriptor, path?: string[]) => {
                if (
                  path != null &&
                  Number(path.length) === 2 &&
                  Number(path.length) !== entity.defaultInstance.currentStateId
                ) {
                  deleteState(entity, Number(path[1]));
                } else {
                  dispatch(
                    Actions.VariableDescriptorActions.deleteDescriptor(
                      entity,
                      path,
                    ),
                  );
                }
              },
            },
            findUsage: {
              label: 'Find usage',
              sorting: 'findUsage',
              action: (entity: IFSMDescriptor) => {
                if (entityIsPersisted(entity) && entity.name != null) {
                  store.dispatch(Actions.EditorActions.searchDeep(entity.name));
                }
              },
            },
          },
        },
      }),
    );
  };
}
/**
 * Edit File
 * @param entity
 * @param cb
 */
export function editFile(
  entity: IAbstractContentDescriptor,
  cb?: (updatedValue: IAbstractContentDescriptor) => void,
) {
  return EditingActionCreator.FILE_EDIT({
    entity,
    cb,
  });
}
/**
 * Create a variableDescriptor
 *
 * @export
 * @param {string} cls class
 * @returns
 */
export function createVariable(
  cls: IAbstractEntity['@class'],
  parent?:
    | IParentDescriptor
    | IListDescriptor
    | IQuestionDescriptor
    | IChoiceDescriptor
    | IWhQuestionDescriptor
    | IPeerReviewDescriptor,
  actions: EditorAction<IAbstractEntity> = {},
) {
  return EditingActionCreator.VARIABLE_CREATE({
    '@class': cls,
    parentId: parent ? parent.id : undefined,
    parentType: parent ? parent['@class'] : undefined,
    actions,
  });
}

// export function editComponent(page: string, path: string[]) {
//   return EditionActionCreator.PAGE_EDIT({ page, path });
// }

/**
 * Save the content from the editor
 *
 * The dispatch argument of the save function is not used to ensure that modifications are made in the global state
 *
 * @export
 * @param {IAbstractEntity} value
 * @returns {ThunkResult}
 */
export function saveEditor(
  value: IMergeable,
  selectUpdatedEntity: boolean = true,
): EditingThunkResult {
  return function save(dispatch, getState) {
    dispatch(discardUnsavedChanges());
    const editMode = getState().editing;
    if (editMode == null) {
      return;
    }
    switch (editMode.type) {
      case 'Variable':
      case 'VariableFSM':
        return dispatch(
          ACTIONS.VariableDescriptorActions.updateDescriptor(
            value as IVariableDescriptor,
            selectUpdatedEntity,
          ),
        );
      case 'VariableCreate':
        return dispatch(
          ACTIONS.VariableDescriptorActions.createDescriptor(
            value as IVariableDescriptor,
            VariableDescriptor.select(editMode.parentId) as
              | IParentDescriptor
              | undefined,
          ),
        );
      case 'File':
        return store.dispatch(() => {
          return FileAPI.updateMetadata(value as IAbstractContentDescriptor)
            .then((res: IAbstractContentDescriptor) => {
              if (selectUpdatedEntity) {
                editingStore.dispatch(editFile(res));
              }
              editMode.cb && editMode.cb(res);
            })
            .catch((res: Error) => {
              editingStore.dispatch(editorErrorEvent(res.message));
            });
        });
    }
  };
}

export function closeEditor() {
  return EditingActionCreator.CLOSE_EDITOR();
}

export function discardUnsavedChanges() {
  return EditingActionCreator.DISCARD_UNSAVED_CHANGES();
}

export function editorEvent(anyEvent: WegasEvents[keyof WegasEvents]) {
  const event: WegasEvent = {
    ...anyEvent,
    timestamp: new Date().getTime(),
    unread: true,
  };
  triggerEventHandlers(event);
  return EditingActionCreator.EDITOR_EVENT(event);
}

export function editorErrorEvent(error: string) {
  return editorEvent({ '@class': 'ClientEvent', error });
}

export function editorEventRemove(timestamp: number) {
  return EditingActionCreator.EDITOR_EVENT_REMOVE({ timestamp });
}

export function editorEventRead(timestamp: number) {
  return EditingActionCreator.EDITOR_EVENT_READ({ timestamp });
}

export function isEditingVariable(
  edition: Edition | undefined,
): edition is VariableEdition {
  return (
    edition != null &&
    (edition.type === 'Variable' || edition.type === 'VariableFSM')
  );
}
