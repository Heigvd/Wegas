import * as React from 'react';
import JSONForm, { Schema } from 'jsoninput';
import { Toolbar } from './Views/Toolbar';
import './FormView';

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

export type IForm = typeof Form;

export class Form extends React.Component<FormProps, { val: any }> {
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
      <Toolbar>
        <Toolbar.Header>
          <button
            disabled={this.state.val === this.props.entity}
            onClick={() => {
              if (this.state.val !== this.props.entity && this.form) {
                const validation = this.form.validate();
                if (validation.length) {
                  console.log(
                    this.state.val,
                    JSON.stringify(validation, null, 2),
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
        </Toolbar.Header>
        <Toolbar.Content>
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
        </Toolbar.Content>
      </Toolbar>
    );
  }
}
