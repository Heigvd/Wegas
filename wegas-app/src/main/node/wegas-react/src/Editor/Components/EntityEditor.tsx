import { Schema } from 'jsoninput';
import { cloneDeep, get } from 'lodash-es';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { IAbstractEntity, IMergeable, IVariableDescriptor } from 'wegas-ts-api';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { mediumPadding } from '../../css/classes';
import { Actions } from '../../data';
import { ActionCreator } from '../../data/actions';
import { editorTitle } from '../../data/methods/VariableDescriptorMethods';
import {
  ActionsProps,
  ComponentEdition,
  Edition,
  isEditingVariable,
  VariableEdition,
} from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { GameModel, Helper, VariableDescriptor } from '../../data/selectors';
import { store, StoreDispatch, useStore } from '../../data/Stores/store';
import { deepUpdate } from '../../data/updateUtils';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import getEditionConfig, { getClassLabel } from '../editionConfig';
import { ErrorBoundary } from './ErrorBoundary';
import { AvailableViews } from './FormView';
import { InstanceProperties } from './Variable/InstanceProperties';

export interface EditorProps<T> extends DisabledReadonly {
  entity?: T;
  update?: (variable: T) => void;
  actions?: ActionsProps<T>[];
  path?: (string | number)[];
  getConfig(entity: T): Promise<Schema<AvailableViews>>;
  error?: {
    message: string;
    onRead: () => void;
  };
  onChange?: (newEntity: T) => void;
  highlight?: boolean;
  localDispatch: StoreDispatch | undefined;
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
  highlight,
  localDispatch,
  ...options
}: EditorProps<T>) {
  let pathEntity = entity as T & { id?: number };
  if (Array.isArray(path) && path.length > 0) {
    pathEntity = get(entity, path);
  }

  if (pathEntity === undefined) {
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
    <Form
      // Force rerender Form when entity change
      key={'id' in pathEntity ? pathEntity.id : undefined}
      entity={pathEntity}
      label={editorTitle({
        label: entity
          ? (entity as { label?: ITranslatableContent }).label
          : undefined,
        editorTag: entity
          ? (entity as { editorTag?: string }).editorTag
          : undefined,
        name: getClassLabel(pathEntity),
      })}
      update={update != null ? updatePath : update}
      actions={actions.map(action => ({
        ...action,
        action: function (e: T) {
          action.action(deepUpdate(entity, path, e) as T, path);
        },
      }))}
      path={path}
      config={overrideSchema(
        entity,
        customSchema !== undefined ? customSchema : schema,
      )}
      onChange={(val: {}) => {
        onChange && onChange(deepUpdate(entity, path, val) as T);
      }}
      highlight={highlight}
      localDispatch={localDispatch}
      {...options}
    />
  );
}
export const AsyncVariableForm = asyncSFC<EditorProps<IMergeable>>(
  WindowedEditor,
  () => {
    const i18nValues = useInternalTranslate(commonTranslations);
    return <div className={mediumPadding}>{i18nValues.loading + '...'}</div>;
  },
  ({ err }: { err: Error }) => {
    const i18nValues = useInternalTranslate(commonTranslations);
    return (
      <span>
        {err && err.message ? err.message : i18nValues.someWentWrong + '...'}
      </span>
    );
  },
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
        // let message = 'Exception : ';
        let message = '';
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

export function getUpdate(
  state: Readonly<Edition>,
  dispatch: StoreDispatch,
  selectUpdatedEntity: boolean = true,
) {
  return 'actions' in state && state.actions.save
    ? state.actions.save
    : (entity: IAbstractEntity) => {
        dispatch(Actions.EditorActions.saveEditor(entity, selectUpdatedEntity));
      };
}

export function getEntity(editionState?: Readonly<Edition>) {
  if (!editionState) {
    return undefined;
  }
  switch (editionState.type) {
    case 'VariableCreate':
      return {
        '@class': editionState['@class'],
        parentId: editionState.parentId,
        parentType: editionState.parentType,
      };
    case 'Variable':
    case 'File':
      return editionState.entity;
    case 'VariableFSM': {
      return VariableDescriptor.select(editionState.entity.id);
    }
    default:
      return undefined;
  }
}

export function editingGotPath(
  editing: Edition | undefined,
): editing is VariableEdition | ComponentEdition {
  return (
    editing?.type === 'Variable' ||
    editing?.type === 'VariableFSM' ||
    editing?.type === 'Component'
  );
}

interface VariableFormProps {
  editing: Edition | undefined;
  entity: IAbstractEntity | IAbstractContentDescriptor | undefined;
  events: WegasEvent[];
  readOnly?: boolean;
  localDispatch: StoreDispatch | undefined;
}

export function VariableForm({
  editing,
  entity,
  events,
  readOnly,
  localDispatch,
}: VariableFormProps) {
  const highlightInstance =
    editing?.highlight &&
    (editing?.type === 'Variable' || editing?.type === 'VariableFSM') &&
    editing?.instanceEditing?.editedInstance != null &&
    !editing.instanceEditing.editedInstance.saved;

  const path = React.useMemo(
    () => (editingGotPath(editing) ? editing.path : undefined),
    [editing],
  );
  const config = React.useMemo(() => editing && getConfig(editing), [editing]);
  const update = React.useMemo(
    () => editing && getUpdate(editing, localDispatch || store.dispatch),
    [editing, localDispatch],
  );
  const actions = React.useMemo(
    () =>
      Object.values(
        editing && 'actions' in editing && editing.actions.more
          ? editing.actions.more
          : {},
      ),
    [editing],
  );

  if (!editing || !config || !update) {
    return null;
  }

  const instanceEditing =
    isEditingVariable(editing) && editing.instanceEditing != null;

  return (
    <ReflexContainer orientation="vertical">
      <ReflexElement>
        <ErrorBoundary>
          <AsyncVariableForm
            path={path}
            getConfig={config}
            update={update}
            actions={actions}
            entity={entity}
            onChange={newEntity => {
              (localDispatch || store.dispatch)(
                ActionCreator.EDITION_CHANGES({
                  newEntity: newEntity as IAbstractEntity,
                }),
              );
            }}
            error={parseEventFromIndex(events)}
            highlight={editing?.highlight && !highlightInstance}
            readOnly={readOnly}
            localDispatch={localDispatch}
          />
        </ErrorBoundary>
      </ReflexElement>
      {instanceEditing && <ReflexSplitter />}
      {instanceEditing && (
        <ReflexElement>
          <InstanceProperties
            editing={editing}
            events={events}
            dispatch={localDispatch || store.dispatch}
            highlight={highlightInstance}
            readOnly={readOnly}
          />
        </ReflexElement>
      )}
    </ReflexContainer>
  );
}

export default function ConnectedVariableForm() {
  const storeProps = useStore(
    (s: State) => ({
      editing: s.global.editing,
      entity: getEntity(s.global.editing),
      events: s.global.events,
    }),
    deepDifferent,
  );
  return <VariableForm {...storeProps} localDispatch={undefined} />;
}
