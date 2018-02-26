import * as React from 'react';
import { connect } from 'react-redux';
import JSONForm, { Schema } from 'jsoninput';
import { State } from '../../data/Reducer/reducers';
import { VariableDescriptor } from '../../data/selectors';
import getEditionConfig from '../editionConfig';
import { Actions } from '../../data';
import './FormView';
import { WithToolbar } from './Views/Toolbar';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { get } from 'lodash-es';
import { deepUpdate } from '../../data/updateUtils';

interface EditorProps {
  entity?: IVariableDescriptor;
  update: (variable: IWegasEntity) => Promise<any>;
  del: (variable: IVariableDescriptor, path?: string[]) => void;
  path?: string[];
  config?: Schema;
}

interface FormProps extends EditorProps {
  schema: Schema;
}

class Form extends React.Component<FormProps, { val: any }> {
  form?: JSONForm;
  constructor(props: FormProps) {
    super(props);
    this.state = { val: props.entity };
  }
  componentWillReceiveProps(nextProps: FormProps) {
    this.setState({ val: nextProps.entity }); // check for others
  }
  render() {
    return (
      <WithToolbar>
        <WithToolbar.Toolbar>
          <button
            disabled={this.state.val === this.props.entity}
            onClick={() => {
              if (this.state.val !== this.props.entity && this.form) {
                const validation = this.form.validate();
                if (validation.length) {
                  console.log(
                    this.state.val,
                    JSON.stringify(validation, null, 2)
                  );
                } else {
                  this.props.update(this.state.val);
                }
              }
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              this.setState({ val: this.props.entity });
            }}
          >
            reset
          </button>
          <button
            onClick={() => {
              this.props.del(this.state.val, this.props.path);
            }}
          >
            delete
          </button>
        </WithToolbar.Toolbar>
        <WithToolbar.Content>
          <JSONForm
            ref={n => {
              if (n != null) {
                this.form = n;
              }
            }}
            value={this.state.val}
            schema={this.props.schema}
            onChange={val => {
              this.setState({ val });
            }}
          />
        </WithToolbar.Content>
      </WithToolbar>
    );
  }
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
  if (config != null) {
    return (
      <Form
        entity={pathEntity}
        update={updatePath}
        del={deletePath}
        schema={{ type: 'object', properties: config }}
      />
    );
  }
  const schema = await getEditionConfig(pathEntity);
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
  ({ err }) => <span>{err.message}</span>
);

export default connect(
  (
    state: State
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
        return dispatch(Actions.EditorActions.saveEditor(entity));
      },
      del(entity: IVariableDescriptor, path?: string[]) {
        return dispatch(
          Actions.VariableDescriptorActions.deleteDescriptor(entity, path)
        );
      },
    };
  }
)(AsyncForm);
