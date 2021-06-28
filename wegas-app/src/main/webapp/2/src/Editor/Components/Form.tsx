import * as React from 'react';
import JSONForm, { Schema } from 'jsoninput';
import { Toolbar } from '../../Components/Toolbar';
import { noOverflow, expandHeight, defaultMargin, MediumPadding } from '../../css/classes';
import './FormView';
import { wwarn } from '../../Helper/wegaslog';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { isActionAllowed } from '../../Components/PageComponents/tools/options';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { DropMenu } from '../../Components/DropMenu';
import { css } from 'emotion';
import { ActionsProps } from '../../data/Reducer/globalState';
import { IconComp } from './Views/FontAwesome';

const closeButtonStyle = css({
color: "black",
});

const toolboxButtonStyle = css({
margin: '0 5px',
height: '35px',
padding: '0 6px'
});

interface EditorProps<T> extends DisabledReadonly {
  entity?: T;
  update?: (variable: T) => void;
  actions: ActionsProps<T>[];
  path?: (string | number)[];
  config?: Schema;
  onChange?: (newEntity: T) => void;
}

export type IForm = typeof Form;

export function Form<T>({
  actions,
  config,
  entity,
  onChange,
  path,
  update,
  disabled,
  readOnly,
}: EditorProps<T>) {
  const oldReceivedEntity = React.useRef(entity);
  const form = React.useRef<JSONForm>(null);
  const [val, setVal] = React.useState(entity);
  const toolbox : ActionsProps<T>[] = [];

  if (
    deepDifferent(entity, oldReceivedEntity.current) &&
    deepDifferent(entity, val)
  ) {
    oldReceivedEntity.current = entity;
    setVal(entity);
  }

  return (
    <Toolbar className={MediumPadding}>
      <Toolbar.Header>
        {isActionAllowed({
          disabled,
          readOnly,
        }) && (
          <>
            {update && (
              <IconButton
                icon="save"
                chipStyle
                tooltip="Save"
                disabled={!deepDifferent(val, entity)}
                onClick={() => {
                  if (form.current != null) {
                    const validation = form.current.validate();
                    if (validation.length) {
                      wwarn(val, JSON.stringify(validation, null, 2));
                    } else if (val != null) {
                      update(val);
                    }
                  }
                }}
                className={expandHeight}
              />
            )}
            <ConfirmButton
              icon="undo"
              chipStyle
              tooltip="Reset"
              onAction={accept => {
                accept && setVal(entity);
              }}
              disableBorders={{
                left: update !== undefined,
                right: actions.length > 0,
              }}
              buttonClassName={expandHeight}
            />
            {actions.map((a, i) => {
              switch (a.sorting){
                  case 'toolbox':
                    toolbox.push(a);
                    break;
                  case 'button':
                    return a.confirm ? (
                      <ConfirmButton
                        key={i}
                        icon="trash"
                        chipStyle
                        tooltip="Delete"
                        onAction={succes =>
                          succes && val != null && a.action(val, path)
                        }
                        buttonClassName={expandHeight}
                      />) : (
                        <IconButton
                          icon= "trash"
                          chipStyle
                          tooltip="Delete"
                          key={i}
                          onClick={() => val != null && a.action(val, path)}
                          className={expandHeight}
                        />
                      )
                  case 'close':
                    <IconButton
                      icon= 'times'
                      tooltip="Close"
                      key={i}
                      onClick={() => val != null && a.action(val, path)}
                      className={closeButtonStyle}
                    />
                    break;
                  default:
                  toolbox.push(a);
                  break;
              }
            })}
            {(toolbox.length > 0) &&
                <DropMenu
                  items={toolbox || []}
                  label={<IconComp icon='cog'/>}
                  onSelect={(i) => {val != null && i.action(val, path)}}
                  buttonClassName={toolboxButtonStyle}
                />
            }

          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content className={noOverflow}>
        <div className={defaultMargin}>
          <JSONForm
            // Ugly workaround to force update JSONForm when config changes or entity changes
            key={JSON.stringify({
              description: config
                ? (config as { description?: string }).description
                : undefined,
              id: val ? (val as { id?: number }).id : undefined,
            })}
            ref={form}
            value={val}
            schema={config}
            onChange={val => {
              setVal(val);
              onChange && onChange(val);
            }}
          />
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}


/*

deux compos, fonction de filtrage
Peux modifier l'interface  actions (et en crééer une exprès)

*/

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