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
  update: (variable: T) => void;
  del: (variable: T, path?: string[]) => void;
  path?: string[];
  getConfig(entity: T): Promise<ConfigurationSchema<T>>;
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
    return update(deepUpdate(entity, path, variable));
  }
  function deletePath() {
    if (entity) return del(entity, path);
    return Promise.resolve();
  }

  const [Form, schema] = await Promise.all<
    IForm,
    Schema | ConfigurationSchema<T>
  >([import('./Form').then(m => m.Form), getConfig(pathEntity)]);
  return (
    <Form
      entity={pathEntity}
      update={updatePath}
      del={deletePath}
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
    <StoreConsumer<State['global']['editing']> selector={s => s.global.editing}>
      {({ state, dispatch }) => {
        function update(entity: IWegasEntity) {
          dispatch(Actions.EditorActions.saveEditor(entity));
        }
        function del(entity: IVariableDescriptor, path?: string[]) {
          dispatch(
            Actions.VariableDescriptorActions.deleteDescriptor(entity, path),
          );
        }
        if (state == null) {
          return null;
        }
        let entity: IVariableDescriptor | undefined;
        if (state.type === 'VariableCreate') {
          entity = {
            '@class': state['@class'],
          } as IVariableDescriptor;
        }
        if (state.type === 'Variable') {
          entity = VariableDescriptor.select(state.id);
        }
        const getConfig = (entity: IVariableDescriptor) => {
          return state.config != null ? Promise.resolve(state.config) : getEditionConfig(entity);
        };
        return (
          <AsyncVariableForm
            {...props}
            {...state}
            getConfig={getConfig}
            update={update}
            del={del}
            entity={entity}
          />
        );
      }}
    </StoreConsumer>
  );
}
