import * as React from 'react';
import { get } from 'lodash-es';
import { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { VariableDescriptor } from '../../data/selectors';
import getEditionConfig, { ConfigurationSchema } from '../editionConfig';
import { Actions } from '../../data';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { deepUpdate } from '../../data/updateUtils';
import { IForm } from './Form';
import { StoreConsumer } from '../../data/store';

interface EditorProps<T> {
  entity?: T;
  update?: (variable: T) => void;
  del?: (variable: T, path?: string[]) => void;
  path?: string[];
  getConfig(entity: T): Promise<ConfigurationSchema<IWegasEntity>>;
}

export async function Editor<T>({
  entity,
  update,
  del,
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
    return update != null && update(deepUpdate(entity, path, variable));
  }
  function deletePath() {
    if (entity) return del != null && del(entity, path);
  }

  const [Form, schema] = await Promise.all<
    IForm,
    Schema | ConfigurationSchema<IWegasEntity>
  >([import('./Form').then(m => m.Form), getConfig(pathEntity)]);
  return (
    <Form
      entity={pathEntity}
      update={update != null ? updatePath : update}
      del={del != null ? deletePath : del}
      path={path}
      schema={{ type: 'object', properties: schema }}
    />
  );
}
const AsyncVariableForm = asyncSFC<EditorProps<IVariableDescriptor>>(
  Editor,
  () => <div>load...</div>,
  ({ err }) => <span>{err.message}</span>,
);

export default function VariableForm(props: {
  entity?: Readonly<IVariableDescriptor>;
  path?: string[];
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
            } as IVariableDescriptor,
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
        if (state == null) {
          return null;
        }
        const update =
          'save' in state.actions
            ? state.actions.save
            : (entity: IWegasEntity) => {
                dispatch(Actions.EditorActions.saveEditor(entity));
              };
        const del =
          'delete' in state.actions
            ? state.actions.delete
            : (entity: IVariableDescriptor, path?: string[]) => {
                dispatch(
                  Actions.VariableDescriptorActions.deleteDescriptor(
                    entity,
                    path,
                  ),
                );
              };
        const getConfig = (entity: IVariableDescriptor) => {
          return state.config != null
            ? Promise.resolve(state.config)
            : getEditionConfig(entity);
        };
        return (
          <AsyncVariableForm
            {...props}
            {...state}
            getConfig={getConfig}
            update={update}
            del={del}
            entity={state.entity}
          />
        );
      }}
    </StoreConsumer>
  );
}
