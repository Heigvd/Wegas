import * as React from 'react';
import { get } from 'lodash-es';
import { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { VariableDescriptor } from '../../data/selectors';
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

export async function WindowedEditor<T>({
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
      schema={schema}
    />
  );
}
const AsyncVariableForm = asyncSFC<EditorProps<{ '@class': string }>>(
  WindowedEditor,
  () => <div>load...</div>,
  ({ err }) => <span>{err.message}</span>,
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
            },
          };
        }
        if (editing.type === 'Variable') {
          return {
            ...editing,
            entity: VariableDescriptor.select(editing.id),
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
          return state.config != null
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
