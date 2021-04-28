import * as React from 'react';
import { get, cloneDeep } from 'lodash-es';
import { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { GameModel, Helper } from '../../data/selectors';
import getEditionConfig from '../editionConfig';
import { Actions } from '../../data';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { deepUpdate } from '../../data/updateUtils';
import { StoreDispatch, store, useStore } from '../../data/Stores/store';
import { AvailableViews } from './FormView';
import { cx } from 'emotion';
import { flex, grow, flexColumn } from '../../css/classes';
import {
  ComponentEdition,
  Edition,
  setUnsavedChanges,
  VariableEdition,
} from '../../data/Reducer/globalState';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { MessageString } from './MessageString';
import { IAbstractEntity, IMergeable, IVariableDescriptor } from 'wegas-ts-api';

export interface EditorProps<T> extends DisabledReadonly {
  entity?: T;
  update?: (variable: T) => void;
  actions?: {
    label: React.ReactNode;
    action: (entity: T, path?: (string | number)[]) => void;
    confirm?: boolean;
  }[];
  path?: (string | number)[];
  getConfig(entity: T): Promise<Schema<AvailableViews>>;
  error?: {
    message: string;
    onRead: () => void;
  };
  onChange?: (newEntity: T) => void;
}

type VISIBILITY = 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE';

const PROTECTION_LEVELS = [
  'INTERNAL',
  'PROTECTED',
  'INHERITED',
  'PRIVATE',
  'ALL',
] as const;
type PROTECTION_LEVEL = ValueOf<typeof PROTECTION_LEVELS>;

function getVisibility(
  defaultValue: VISIBILITY,
  inheritedValue?: VISIBILITY,
  entity?: IAbstractEntity,
): VISIBILITY {
  if (entity && typeof entity === 'object') {
    if ('visibility' in entity) {
      return (entity as any).visibility as VISIBILITY;
    }
    if (inheritedValue) {
      return inheritedValue;
    }
    let p = Helper.getParent(entity);
    while (p) {
      if ('visibility' in p) {
        return (p as any).visibility as VISIBILITY;
      }
      p = Helper.getParent(p);
    }
    return defaultValue;
  }

  return inheritedValue || defaultValue;
}

/**
 * when editing a scenatio which depends on a model, some properties are not editable.
 * Hence, the schema must be modified to make some views readonly.
 */
function _overrideSchema(
  schema: Schema<AvailableViews>,
  entity?: IAbstractEntity,
  inheritedVisibility?: VISIBILITY,
  inheritedProtectionLevel?: PROTECTION_LEVEL,
) {
  const v = getVisibility('PRIVATE', inheritedVisibility, entity);
  const pl =
    ('protectionLevel' in schema && schema['protectionLevel']) ||
    inheritedProtectionLevel ||
    'PROTECTED';

  const readOnly =
    PROTECTION_LEVELS.indexOf(v) <= PROTECTION_LEVELS.indexOf(pl);

  if (readOnly) {
    if (schema.view) {
      (schema.view as any).readOnly = true;
    } else {
      schema.view = {
        readOnly,
      };
    }
  }

  if ('properties' in schema) {
    const oSchema = schema as Schema.Object;
    for (const key in oSchema.properties) {
      if (oSchema.properties[key]) {
        if (entity && key in entity) {
          _overrideSchema(
            oSchema.properties[key] as any,
            (entity as any)[key],
            v,
            pl,
          );
        } else {
          _overrideSchema(oSchema.properties[key] as any, undefined, v, pl);
        }
      }
    }
    if (readOnly) {
      if (oSchema.additionalProperties) {
        if (oSchema.additionalProperties.view) {
          (oSchema.additionalProperties.view as any).readOnly = true;
        } else {
          (oSchema.additionalProperties.view as any) = {
            readOnly,
          };
        }
      }
    }
  } else if ('items' in schema) {
    const aSchema = schema as Schema.Array;
    if (Array.isArray(entity) && entity.length > 0) {
      _overrideSchema(aSchema.items as any, entity[0], v, pl);
    } else {
      _overrideSchema(aSchema.items as any, undefined, v, pl);
    }
  }

  return schema;
}

export function overrideSchema(entity: any, schema: Schema<AvailableViews>) {
  const gameModel = GameModel.selectCurrent();
  if (gameModel.type === 'SCENARIO') {
    return _overrideSchema(cloneDeep(schema), entity);
    /*if (gameModel.basedOnId && gameModel.basedOnId >= 0) {
      // Editing a scenario which depends on a model -> some properties are read-only
    } else {
      return _overrideSchema(cloneDeep(schema), entity);
    }*/
  }
  return schema;
}

async function WindowedEditor<T extends IMergeable>({
  entity,
  update,
  actions = [],
  getConfig,
  path,
  error,
  onChange,
  ...options
}: EditorProps<T>) {
  let pathEntity = entity;
  if (Array.isArray(path) && path.length > 0) {
    pathEntity = get(entity, path);
  }

  // const customSchemas = useStore(s => {
  //   return s.global.schemas;
  // }, shallowDifferent);

  if (pathEntity === undefined) {
    // return <span>There is nothing to edit</span>;
    return null;
  }

  function updatePath(variable: {}) {
    return update != null && update(deepUpdate(entity, path, variable) as T);
  }

  const [Form, schema] = await Promise.all<
    typeof import('./Form')['Form'],
    Schema<AvailableViews>
  >([import('./Form').then(m => m.Form), getConfig(pathEntity)]);

  // First try to get schema from simple filters
  const customSchemas = store.getState().global.schemas;
  let customSchema: SimpleSchema | void;
  const simpleCustomSchemaName = customSchemas.filtered[pathEntity['@class']];
  if (simpleCustomSchemaName !== undefined) {
    const nfSchema = customSchemas.views[simpleCustomSchemaName](
      pathEntity,
      schema,
    );
    if (nfSchema !== undefined) {
      customSchema = nfSchema;
    }
  }
  // Then try to get schema from complex filters
  for (const schemaName of customSchemas.unfiltered) {
    const nfSchema = customSchemas.views[schemaName](pathEntity, schema);
    if (nfSchema !== undefined) {
      customSchema = nfSchema;
      break;
    }
  }
  return (
    <div className={cx(flex, grow, flexColumn)}>
      <MessageString
        value={error && error.message}
        type={'error'}
        duration={3000}
        onLabelVanish={error && error.onRead}
      />
      <Form
        entity={pathEntity}
        update={update != null ? updatePath : update}
        actions={actions.map(action => ({
          ...action,
          action: function (e: T) {
            action.action(deepUpdate(entity, path, e) as T, path);
          },
        }))}
        path={path}
        schema={overrideSchema(
          entity,
          customSchema !== undefined ? customSchema : schema,
        )}
        onChange={onChange}
        {...options}
      />
    </div>
  );
}
export const AsyncVariableForm = asyncSFC<EditorProps<IMergeable>>(
  WindowedEditor,
  () => <div>load...</div>,
  ({ err }: { err: Error }) => (
    <span>{err && err.message ? err.message : 'Something went wrong...'}</span>
  ),
);

/**
 * Retrieve message event and make it readable
 * @param event - the event to parse
 */
export function parseEvent(
  event: WegasEvent,
  dispatch: StoreDispatch = store.dispatch,
) {
  const onRead = () =>
    dispatch(Actions.EditorActions.editorEventRead(event.timestamp));
  switch (event['@class']) {
    case 'ClientEvent':
      return { message: event.error, onRead };
    case 'ExceptionEvent': {
      if (event.exceptions.length > 0) {
        let message = 'Exceptions :';
        for (const exception of event.exceptions) {
          switch (exception['@class']) {
            case 'WegasConflictException':
              message += 'Conflict between variables';
              break;
            case 'WegasErrorMessage':
              message += exception.message;
              break;

            case 'WegasNotFoundException':
              message += exception.message;
              break;

            case 'WegasOutOfBoundException': {
              const min = exception.min ? exception.min : '-∞';
              const max = exception.max ? exception.max : '∞';
              const error =
                '"' +
                exception.variableName +
                '" is out of bound. <br>(' +
                exception.value +
                ' not in [' +
                min +
                ';' +
                max +
                '])';
              message += error;
              break;
            }
            case 'WegasScriptException': {
              let error = exception.message;
              if (exception.lineNumber) {
                error += ' at line ' + exception.lineNumber;
              }
              if (exception.script) {
                error += ' in script ' + exception.script;
              }
              message += error;
              break;
            }
            case 'WegasWrappedException':
              message = 'Unexpected error: ' + exception.message;
              break;
            default:
              message += 'Severe error';
          }
        }
        return { message, onRead };
      }
    }
  }
  return { message: `Unknown event : ${event['@class']}`, onRead };
}

/**
 * Retrieve error message from stored events
 * @param state the events stored
 * @param dispatch the dispatcher fn of the
 * @param index the index of the event
 */
export function parseEventFromIndex(
  state: Readonly<WegasEvent[]>,
  dispatch: StoreDispatch = store.dispatch,
  index: number = 0,
) {
  if (state.length > index) {
    const currentEvent = state[index];
    if (currentEvent) {
      parseEvent(currentEvent, dispatch);
    }
    return undefined;
  }
}

export function getStateConfig(
  state: Readonly<Edition>,
  entity: IVariableDescriptor,
) {
  return 'config' in state && state.config != null
    ? Promise.resolve(state.config)
    : (getEditionConfig(entity) as Promise<Schema<AvailableViews>>);
}

export function getConfig(state: Readonly<Edition>) {
  return (entity: IVariableDescriptor) => getStateConfig(state, entity);
}

export function getUpdate(state: Readonly<Edition>, dispatch: StoreDispatch) {
  return 'actions' in state && state.actions.save
    ? state.actions.save
    : (entity: IAbstractEntity) => {
        dispatch(Actions.EditorActions.saveEditor(entity));
      };
}

export function getEntity(state?: Readonly<Edition>) {
  if (!state) {
    return undefined;
  }
  switch (state.type) {
    case 'VariableCreate':
      return {
        '@class': state['@class'],
        parentId: state.parentId,
        parentType: state.parentType,
      };
    case 'Variable':
    case 'VariableFSM':
    case 'File':
      return state.entity;
    default:
      return undefined;
  }
}

function editingGotPath(
  editing: Edition | undefined,
): editing is VariableEdition | ComponentEdition {
  return (
    editing?.type === 'Variable' ||
    editing?.type === 'VariableFSM' ||
    editing?.type === 'Component'
  );
}

export default function VariableForm() {
  const editing = useStore((s: State) => s.global.editing, deepDifferent);

  const entity = useStore(
    (s: State) => s.global.editing && getEntity(s.global.editing),
    deepDifferent,
  );
  const events = useStore((s: State) => s.global.events, deepDifferent);

  if (!editing || !editing) {
    return null;
  }

  return (
    <AsyncVariableForm
      path={editingGotPath(editing) ? editing.path : undefined}
      getConfig={getConfig(editing)}
      update={getUpdate(editing, store.dispatch)}
      actions={Object.values(
        'actions' in editing && editing.actions.more
          ? editing.actions.more
          : {},
      )}
      entity={entity}
      onChange={() => {
        store.dispatch(setUnsavedChanges(true));
      }}
      error={parseEventFromIndex(events)}
    />
  );
}
