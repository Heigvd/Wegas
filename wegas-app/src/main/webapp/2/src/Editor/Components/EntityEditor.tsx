import * as React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash-es';
import { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { VariableDescriptor } from '../../data/selectors';
import getEditionConfig, { ConfigurationSchema } from '../editionConfig';
import { Actions } from '../../data';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { deepUpdate } from '../../data/updateUtils';
import { IForm } from './Form';
interface EditorProps {
  entity?: IVariableDescriptor;
  update: (variable: IWegasEntity) => void;
  del: (variable: IVariableDescriptor, path?: string[]) => void;
  path?: string[];
  config?: Schema;
}

async function Editor({ entity, update, del, config, path }: EditorProps) {
  let pathEntity = entity;
  if (Array.isArray(path) && path.length > 0) {
    pathEntity = get(entity, path);
  }
  if (pathEntity === undefined) {
    return <span>There is nothing to edit</span>;
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

export default connect(
  (
    state: State,
  ): {
    entity?: Readonly<IVariableDescriptor>;
    path?: string[];
    config?: Schema;
  } => {
    if (state.global.editing === undefined) {
      return {};
    }
    if (state.global.editing.type === 'VariableCreate') {
      return {
        entity: {
          '@class': state.global.editing['@class'],
        } as IVariableDescriptor,
      };
    }
    if (state.global.editing.type === 'Variable') {
      return {
        entity: VariableDescriptor.select(state.global.editing.id),
        path: state.global.editing.path,
        config: state.global.editing.config,
      };
    }
    return {};
  },
  dispatch => {
    return {
      update(entity: IWegasEntity) {
        dispatch(Actions.EditorActions.saveEditor(entity));
      },
      del(entity: IVariableDescriptor, path?: string[]) {
        dispatch(
          Actions.VariableDescriptorActions.deleteDescriptor(entity, path),
        );
      },
    };
  },
)(AsyncForm);
