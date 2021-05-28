import * as React from 'react';
import JSONForm, { Schema } from 'jsoninput';
import { Toolbar } from '../../Components/Toolbar';
import { defaultMargin, noOverflow, expandHeight } from '../../css/classes';
import './FormView';
import { Button, ButtonProps } from '../../Components/Inputs/Buttons/Button';
import { wlog, wwarn } from '../../Helper/wegaslog';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { isActionAllowed } from '../../Components/PageComponents/tools/options';

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

  if (
    deepDifferent(entity, oldReceivedEntity.current) &&
    deepDifferent(entity, val)
  ) {
    oldReceivedEntity.current = entity;
    setVal(entity);
  }

  wlog({ val, config });

  return (
    <Toolbar>
      <Toolbar.Header>
        {isActionAllowed({
          disabled,
          readOnly,
        }) && (
          <>
            {update && (
              <Button
                label="Save"
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
                disableBorders={{ right: true }}
              />
            )}
            <ConfirmButton
              label="Reset"
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
              const btnProps: ButtonProps = {
                label: a.label,
                tabIndex: 1,
                disableBorders: {
                  left: true,
                  right: i !== actions.length - 1,
                },
              };
              return a.confirm ? (
                <ConfirmButton
                  {...btnProps}
                  key={i}
                  onAction={succes =>
                    succes && val != null && a.action(val, path)
                  }
                  buttonClassName={expandHeight}
                />
              ) : (
                <Button
                  {...btnProps}
                  key={i}
                  onClick={() => val != null && a.action(val, path)}
                  className={expandHeight}
                />
              );
            })}
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
