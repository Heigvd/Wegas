import * as React from 'react';
import { get, cloneDeep } from 'lodash-es';
import { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { GameModel, Helper } from '../../data/selectors';
import getEditionConfig from '../editionConfig';
import { Actions } from '../../data';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { deepUpdate } from '../../data/updateUtils';
import {
  StoreConsumer,
  StoreDispatch,
  store,
  useStore,
} from '../../data/store';
import { AvailableViews } from './FormView';
import { cx } from 'emotion';
import { flex, grow, flexColumn } from '../../css/classes';
import { StyledLabel } from '../../Components/AutoImport/String/Label';
import { shallowDifferent, deepDifferent } from '../../data/connectStore';
import { Edition } from '../../data/Reducer/globalState';
import { SimpleSchema } from '../../Components/Hooks/types/scriptShemaGlobals';
import { wlog } from '../../Helper/wegaslog';

export interface EditorProps<T> {
  entity?: T;
  update?: (variable: T) => void;
  actions?: {
    label: React.ReactNode;
    action: (entity: T, path?: (string | number)[]) => void;
  }[];
  path?: (string | number)[];
  getConfig(entity: T): Promise<Schema<AvailableViews>>;
  error?: {
    message: string;
    onVanish: () => void;
  };
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
}: EditorProps<T>) {
  let pathEntity = entity;
  if (Array.isArray(path) && path.length > 0) {
    pathEntity = get(entity, path);
  }

  // const customSchema = useStore(s => {
  //   // First try to get schema from simple filters
  //   const newSchemaFn =
  //     s.global.shemas.filtered[(pathEntity as IMergeable)['@class']];
  //   let newSchema: Schema<AvailableViews> | undefined;
  //   if (newSchemaFn !== undefined) {
  //     newSchema = newSchemaFn(pathEntity as IMergeable);
  //   }
  //   // Then try to get shema from complex filters
  //   for (const sh of s.global.shemas.custom) {
  //     const nfSchema = sh(pathEntity as IMergeable);
  //     if (nfSchema) {
  //       newSchema = nfSchema;
  //       break;
  //     }
  //   }
  //   return newSchema;
  // }, deepDifferent);

  // const filteredSchemas = useStore(s => {
  //   return s.global.schemas.filtered;
  // }, shallowDifferent);
  // const customSchemas = useStore(s => {
  //   return s.global.schemas.custom;
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

  // debugger;

  // // First try to get schema from simple filters
  // let customSchema: SimpleSchema | undefined;
  // const simpleCustomShemaFN = customSchemas.filtered[pathEntity['@class']];
  // if (customSchemas.filtered[pathEntity['@class']]) {
  //   customSchema = simpleCustomShemaFN(pathEntity, schema);
  // }
  // // Then try to get shema from complex filters
  // for (const sh of customSchemas.custom) {
  //   const nfSchema = sh(pathEntity, schema);
  //   if (nfSchema !== undefined) {
  //     customSchema = nfSchema;
  //     break;
  //   }
  // }

  // wlog(customSchema !== undefined ? customSchema : schema);
  // debugger;

  return (
    <div className={cx(flex, grow, flexColumn)}>
      <StyledLabel
        value={error && error.message}
        type={'error'}
        duration={3000}
        onLabelVanish={error && error.onVanish}
      />
      <Form
        entity={pathEntity}
        update={update != null ? updatePath : update}
        actions={actions.map(({ label, action }) => {
          return {
            label,
            action: function(e: T) {
              action(deepUpdate(entity, path, e) as T, path);
            },
          };
        })}
        path={path}
        // schema={overrideSchema(
        //   entity,
        //   customSchema !== undefined ? customSchema : schema,
        // )}
        schema={overrideSchema(entity, schema)}
      />
    </div>
  );
}
export const AsyncVariableForm = asyncSFC<EditorProps<{ '@class': string }>>(
  WindowedEditor,
  () => <div>load...</div>,
  ({ err }: { err: Error }) => (
    <span>{err && err.message ? err.message : 'Something went wrong...'}</span>
  ),
);

/**
 * Retrieve error message from stored events
 * @param state the events stored
 * @param dispatch the dispatcher fn of the
 */
export const getError = (
  state: Readonly<WegasEvents[]>,
  dispatch: StoreDispatch,
) => {
  const onVanish = () => dispatch(Actions.EditorActions.editorErrorRemove());
  if (state.length > 0) {
    const currentEvent = state[0];
    switch (currentEvent['@class']) {
      case 'ClientEvent':
        return { message: currentEvent.error, onVanish };
      case 'ExceptionEvent': {
        if (currentEvent.exceptions.length > 0) {
          const currentException = currentEvent.exceptions[0];
          switch (currentException['@class']) {
            case 'WegasConflictException':
              return { message: 'Conflict between variables', onVanish };
            case 'WegasErrorMessage':
              return { message: currentException.message, onVanish };
            case 'WegasNotFoundException':
              return { message: currentException.message, onVanish };
            case 'WegasOutOfBoundException': {
              const min = currentException.min ? currentException.min : '-∞';
              const max = currentException.max ? currentException.max : '∞';
              const error =
                '"' +
                currentException.variableName +
                '" is out of bound. <br>(' +
                currentException.value +
                ' not in [' +
                min +
                ';' +
                max +
                '])';
              return { message: error, onVanish };
            }
            case 'WegasScriptException': {
              let error = currentException.message;
              if (currentException.lineNumber) {
                error += ' at line ' + currentException.lineNumber;
              }
              if (currentException.script) {
                error += ' in script ' + currentException.script;
              }
              return { message: error, onVanish };
            }
            case 'WegasWrappedException':
              return {
                message: 'Unexpected error: ' + currentException.message,
                onVanish,
              };
            default:
              return { message: 'Severe error', onVanish };
          }
        }
      }
    }
  }
  return undefined;
};

export const getConfig = (state: Readonly<Edition>) => (
  entity: IVariableDescriptor,
) => {
  return 'config' in state && state.config != null
    ? Promise.resolve(state.config)
    : (getEditionConfig(entity) as Promise<Schema<AvailableViews>>);
};

export const getUpdate = (state: Readonly<Edition>, dispatch: StoreDispatch) =>
  'actions' in state && state.actions.save
    ? state.actions.save
    : (entity: IAbstractEntity) => {
        dispatch(Actions.EditorActions.saveEditor(entity));
      };

export const getEntity = (state?: Readonly<Edition>) => {
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
};

export default function VariableForm(props: {
  entity?: Readonly<IVariableDescriptor>;
  path?: (string | number)[];
  config?: Schema;
}) {
  return (
    <StoreConsumer
      selector={(s: State) => {
        const editing = s.global.editing;
        if (!editing) {
          return null;
        } else {
          const entity = getEntity(editing);
          if (entity == null) {
            return null;
          } else {
            return { editing, entity, events: s.global.events };
          }
        }
      }}
      shouldUpdate={shallowDifferent}
    >
      {({ state, dispatch }) => {
        if (state == null || state.entity == null) {
          return null;
        }

        return (
          <AsyncVariableForm
            {...props}
            {...state.editing}
            getConfig={getConfig(state.editing)}
            update={getUpdate(state.editing, dispatch)}
            actions={Object.values(
              'actions' in state.editing && state.editing.actions.more
                ? state.editing.actions.more
                : {},
            )}
            entity={state.entity}
            error={getError(state.events, dispatch)}
          />
        );
      }}
    </StoreConsumer>
  );
}
