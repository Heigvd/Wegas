import * as React from 'react';
import JSONForm, { Schema } from 'jsoninput';
import { Toolbar } from '../../Components/Toolbar';
import { noOverflow, expandHeight, MediumPadding, toolboxHeaderStyle, defaultMarginTop, expandWidth } from '../../css/classes';
import './FormView';
import { wwarn } from '../../Helper/wegaslog';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { isActionAllowed } from '../../Components/PageComponents/tools/options';
import { IconButton, IconButtonProps } from '../../Components/Inputs/Buttons/IconButton';

function IconAction(label:string|undefined){
  switch (label) {
    case 'Duplicate':
      return "copy";
    case 'Delete':
      return "trash";
    case 'Find usage':
      return 'user-secret';
    case 'Close':
      return 'times';
    case 'Instance':
      return 'columns';
    default:
      return 'poo';
}}
interface EditorProps<T> extends DisabledReadonly {
  entity?: T;
  update?: (variable: T) => void;
  actions: {
    action: (entity: T, path?: (string | number)[]) => void;
    label: React.ReactNode;
    confirm?: boolean;
  }[];
  path?: (string | number)[];
  config?: Schema;
}

interface FormProps<T> extends EditorProps<T> {
  schema: Schema;
}

export type IForm = typeof Form;

export class Form<T> extends React.Component<
  FormProps<T>,
  {
    val: any;
    oldProps: FormProps<T>;
    // Used to reset Form (for default values)
    id: number;
  }
> {
  form?: JSONForm;
  static getDerivedStateFromProps(
    nextProps: FormProps<any>,
    state: { oldProps: FormProps<any>; id: number; val: any },
  ) {
    if (state.oldProps === nextProps) {
      return null;
    }
    return {
      val: nextProps.entity,
      oldProps: nextProps,
      id: (state.id + 1) % 100,
    };
  }
  static defaultProps = {
    actions: [],
  };
  constructor(props: FormProps<T>) {
    super(props);
    this.state = { oldProps: props, val: props.entity, id: 0 };
  }
  render() {
    return (
      <Toolbar className={MediumPadding}>
        <Toolbar.Header className={toolboxHeaderStyle}>
          {isActionAllowed({
            disabled: this.props.disabled,
            readOnly: this.props.readOnly,
          }) && (
            <>
              {this.props.update && (
                <IconButton
                  icon="save"
                  chipStyle
                  disabled={!deepDifferent(this.state.val, this.props.entity)}
                  onClick={() => {
                    if (this.state.val !== this.props.entity && this.form) {
                      const validation = this.form.validate();
                      if (validation.length) {
                        wwarn(
                          this.state.val,
                          JSON.stringify(validation, null, 2),
                        );
                      } else {
                        this.props.update!(this.state.val);
                      }
                    }
                  }}
                  className={expandHeight}
                />
              )}
              <ConfirmButton
                icon="redo"
                onAction={accept => {
                  accept && this.setState({ val: this.props.entity });
                }}
                disableBorders={{
                  left: this.props.update !== undefined,
                  right: this.props.actions.length > 0,
                }}
                buttonClassName={expandHeight}
                tooltip="Reset"
                chipStyle
              />
               {this.props.actions.map((a, i) => {
                  const btnProps: IconButtonProps = {
                    tabIndex: 1,
                    chipStyle: true,
                    tooltip: a.label?.toString(),
                    icon:IconAction(a.label?.toString()),
                  };
                  return a.confirm ? (
                      <ConfirmButton
                        {...btnProps}
                        key={i}
                        onAction={succes =>
                          succes && a.action(this.state.val, this.props.path)
                        }
                        buttonClassName={expandHeight}
                      />
                    ) : (
                      <IconButton
                        {...btnProps}
                        key={i}
                        onClick={() => a.action(this.state.val, this.props.path)}
                        className={expandHeight}
                      />
                    );
                })
                //AdvancedToolBoxItem()
                }
            </>
          )}
        </Toolbar.Header>
        <Toolbar.Content className={noOverflow}>
          <div className={expandWidth}>
            <h2 className={defaultMarginTop}>{//how to take the same label than in treeview?
            this.state.val.name
            }</h2>
            <JSONForm
              ref={n => {
                if (n != null) {
                  this.form = n;
                }
              }}
              key={this.state.id}
              value={this.state.val}
              schema={this.props.schema}
              onChange={val => {
                this.setState({ val });
              }}
            />
          </div>
        </Toolbar.Content>
      </Toolbar>
    );
  }
}



/*  function AdvancedToolBoxItem(actions:any) {
  const dropMenuOtherActions: any[] = [];

  actions.map((action:any, i:string) => {
    const btnProps: IconButtonProps = {
      tabIndex: 1,
      chipStyle: true,
      tooltip: action.label?.toString(),
      icon:IconAction(action.label?.toString()),
    };
    //switch: fill the table, create buttons if necessary, create close tag if exist
    // if table.length > 0, create dropdownmenu with elements
      switch (action.label) {
        case 'Duplicate':
          dropMenuOtherActions.push(action);
          break;
        case 'Delete':
          return (
            <ConfirmButton
              {...btnProps}
              key={i}
              onAction={succes =>
                succes && action.action(this.state.val, this.props.path)
              }
              buttonClassName={expandHeight}
            />)
        case 'Find usage':
          dropMenuOtherActions.push(action);
          break;
        case 'Close':
          <IconButton
            {...btnProps}
            key={i}
            onClick={() => action.action(this.state.val, this.props.path)}
            className={expandHeight}
          />
          break;
        case 'Instance':
          dropMenuOtherActions.push(action);
          break;
        default:
          return (
            <IconButton
            tabIndex= {1}
            chipStyle
            tooltip= {action.label?.toString()}
            icon="cat"
            key={i}
            onClick={() => action.action(this.state.val, this.props.path)}
            className={expandHeight}
          />
          );
    };
  }
  )
  if (dropMenuOtherActions.length > 0){
    <DropMenu
      items={dropMenuOtherActions || []}
      icon="cog"
      onSelect={(i, e) => {i.action(this.state.val, this.props.path)
      }}
    />
  }
} */