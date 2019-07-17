import * as React from 'react';
import { get, cloneDeep } from 'lodash-es';
import { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { VariableDescriptor, GameModel, Helper } from '../../data/selectors';
import getEditionConfig from '../editionConfig';
import { Actions } from '../../data';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { deepUpdate } from '../../data/updateUtils';
import { StoreConsumer } from '../../data/store';
import { AvailableViews } from './FormView';

interface EditorProps<T> {
  entity?: T;
  update?: (variable: T) => void;
  actions?: {
    label: React.ReactNode;
    action: (entity: T, path?: (string | number)[]) => void;
  }[];
  path?: (string | number)[];
  getConfig(entity: T): Promise<Schema<AvailableViews>>;
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

function overrideSchema(entity: any, schema: Schema<AvailableViews>) {
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

async function WindowedEditor<T>({
  entity,
  update,
  actions = [],
  getConfig,
  path,
}: EditorProps<T>) {
  let pathEntity = entity;
  if (Array.isArray(path) && path.length > 0) {
    pathEntity = get(entity, path);
  }
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
  return (
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
      schema={overrideSchema(entity, schema)}
    />
  );
}
const AsyncVariableForm = asyncSFC<EditorProps<{ '@class': string }>>(
  WindowedEditor,
  () => <div>load...</div>,
  ({ err }: { err: Error }) => <span>{err.message}</span>,
);

export default function VariableForm(props: {
  entity?: Readonly<IVariableDescriptor>;
  path?: (string | number)[];
  config?: Schema;
}) {
  return (
    <StoreConsumer
      selector={(s: State) => {
        const editing = s.global.editing;
        if (editing == null) {
          return null;
        }
        if (editing.type === 'VariableCreate') {
          return {
            ...editing,
            entity: {
              '@class': editing['@class'],
              parentId: editing.parentId,
              parentType: editing.parentType,
            },
          };
        }
        if (editing.type === 'Variable') {
          return {
            ...editing,
            entity: VariableDescriptor.select(editing.id),
          };
        }
        if (editing.type === 'File') {
          return {
            ...editing,
            entity: {
              '@class': 'File',
              ...editing.file,
            },
          };
        }
        return null;
      }}
    >
      {({ state, dispatch }) => {
        if (state == null || state.entity == null) {
          return null;
        }
        const update =
          'save' in state.actions
            ? state.actions.save
            : (entity: IAbstractEntity) => {
                dispatch(Actions.EditorActions.saveEditor(entity));
              };
        const getConfig = (entity: IVariableDescriptor) => {
          return 'config' in state && state.config != null
            ? Promise.resolve(state.config)
            : (getEditionConfig(entity) as Promise<Schema<AvailableViews>>);
        };

        return (
          <AsyncVariableForm
            {...props}
            {...state}
            getConfig={getConfig}
            update={update}
            actions={Object.values(state.actions.more || {})}
            entity={state.entity}
          />
        );
      }}
    </StoreConsumer>
  );
}
