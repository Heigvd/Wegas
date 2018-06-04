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
interface EditorProps {
  entity?: IVariableDescriptor;
  update: (variable: IWegasEntity) => void;
  del: (variable: IVariableDescriptor, path?: string[]) => void;
  path?: string[];
  config?: Schema;
}

export async function Editor({
  entity,
  update,
  del,
  config,
  path,
}: EditorProps) {
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
    Schema | ConfigurationSchema<IVariableDescriptor<IVariableInstance>>
  >([
    import('./Form').then(m => m.Form),
    config != null ? Promise.resolve(config) : getEditionConfig(pathEntity),
  ]);
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
const AsyncForm = asyncSFC(
  Editor,
  () => <div>load...</div>,
  ({ err }) => <span>{err.message}</span>,
);

export default function ConnectedAsyncForm(props: {
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
        return (
          <AsyncForm
            {...props}
            {...state}
            update={update}
            del={del}
            entity={entity}
          />
        );
      }}
    </StoreConsumer>
  );
}
