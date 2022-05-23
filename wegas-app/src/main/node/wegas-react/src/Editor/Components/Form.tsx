import { css, cx } from '@emotion/css';
import JSONForm, { Schema } from 'jsoninput';
import * as React from 'react';
import { DropMenu } from '../../Components/DropMenu';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { isActionAllowed } from '../../Components/PageComponents/tools/options';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { Toolbar } from '../../Components/Toolbar';
import {
  defaultMarginBottom,
  defaultMarginRight,
  defaultPaddingLeft,
  defaultPaddingRight,
  expandHeight,
  flex,
  flexRow,
  flexWrap,
  grow,
  itemCenter,
  toolboxHeaderStyle,
} from '../../css/classes';
import { EditingActionCreator } from '../../data/Reducer/editingState';
import {
  editingStore,
  EditingStoreDispatch,
} from '../../data/Stores/editingStore';
import { wwarn } from '../../Helper/wegaslog';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import './FormView';
import { MessageString } from './MessageString';
import { Icon, IconComp } from './Views/FontAwesome';

const toolboxContainerStyle = css({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  padding: '1em',
  backgroundColor: themeVar.colors.BackgroundColor,
});
const toolboxButtonStyle = css({
  margin: '0 5px',
  height: '35px',
  padding: '0 6px',
});
const noHighlightStyle = css({
  boxShadow: 'initial',
  transition: '0.5s',
});
const highlightStyle = css({
  boxShadow: `inset 0px 0px 0px 10px ${themeVar.colors.HighlightColor}`,
});

interface DefaultFormAction<T> {
  type: string;
  action: (entity: T, path?: (string | number)[]) => void;
  index?: number;
  disabledFN?: (oldEntity: T, newEntity: T) => boolean;
}

interface IconFormAction<T> extends DefaultFormAction<T> {
  type: 'IconAction';
  label: string;
  confirm?: boolean;
  icon: Icon;
}

interface ToolboxFormAction<T> extends DefaultFormAction<T> {
  type: 'ToolboxAction';
  label: React.ReactNode;
}

export type FormAction<T> = IconFormAction<T> | ToolboxFormAction<T>;

function isIconAction<T>(action: FormAction<T>): action is IconFormAction<T> {
  return action.type === 'IconAction';
}

function isToolboxAction<T>(
  action: FormAction<T>,
): action is ToolboxFormAction<T> {
  return !isIconAction(action);
}

function sortFormAction<T>(action1: FormAction<T>, action2: FormAction<T>) {
  return (action1.index || 0) - (action2.index || 0);
}

interface EditorProps<T> extends DisabledReadonly {
  entity?: T;
  update?: (variable: T) => void;
  actions: FormAction<T>[];
  path?: (string | number)[];
  config?: Schema;
  onChange?: (newEntity: T) => void;
  label?: React.ReactNode;
  highlight?: boolean;
  localDispatch: EditingStoreDispatch | undefined;
  error?: {
    message: string;
    onRead: () => void;
  };
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
  label,
  highlight,
  localDispatch,
  error,
}: EditorProps<T>) {
  const oldReceivedEntity = React.useRef(entity);
  const form = React.useRef<JSONForm>(null);
  const [val, setVal] = React.useState(entity);

  const iconActions = actions.filter(isIconAction).sort(sortFormAction);
  const toolboxActions = actions.filter(isToolboxAction).sort(sortFormAction);
  const i18nValues = useInternalTranslate(commonTranslations);

  React.useEffect(() => {
    oldReceivedEntity.current = entity;
  }, [entity]);

  if (
    deepDifferent(entity, oldReceivedEntity.current) &&
    deepDifferent(entity, val)
  ) {
    setVal(entity);
  }

  return (
    <Toolbar className={expandHeight}>
      <Toolbar.Header
        className={cx(
          flex,
          flexRow,
          flexWrap,
          toolboxHeaderStyle,
          toolboxContainerStyle,
        )}
      >
        <div className={cx(grow, defaultMarginRight)}>
          <h3 className={defaultMarginBottom}>{label}</h3>
        </div>
        <div className={cx(flex, flexRow, itemCenter)}>
          {isActionAllowed({
            disabled,
            readOnly,
          }) && (
            <>
              {update && (
                <IconButton
                  icon="save"
                  chipStyle
                  tooltip={i18nValues.save}
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
              {iconActions.map(({ icon, label, confirm, action, disabledFN }) =>
                confirm ? (
                  <ConfirmButton
                    key={label}
                    tooltip={label}
                    icon={icon}
                    disabled={
                      val == null ||
                      entity == null ||
                      (disabledFN && disabledFN(entity, val))
                    }
                    onAction={success =>
                      success && val != null && action(val, path)
                    }
                  />
                ) : (
                  <Button
                    key={label}
                    tooltip={label}
                    icon={icon}
                    disabled={
                      val == null ||
                      entity == null ||
                      (disabledFN && disabledFN(entity, val))
                    }
                    onClick={() => val != null && action(val, path)}
                  />
                ),
              )}
              {toolboxActions.length > 0 && (
                <DropMenu
                  items={toolboxActions.map(action => ({
                    ...action,
                    disabled:
                      entity == null ||
                      val == null ||
                      (action.disabledFN && action.disabledFN(entity, val)),
                  }))}
                  label={<IconComp icon="cog" />}
                  onSelect={i => {
                    val != null && i.action(val, path);
                  }}
                  buttonClassName={toolboxButtonStyle}
                />
              )}
            </>
          )}
        </div>
        {error && (
          <MessageString
            value={error.message}
            type={'error'}
            duration={3000}
            onLabelVanish={error.onRead}
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content
        className={cx(grow, defaultPaddingLeft, defaultPaddingRight, {
          [highlightStyle]: highlight,
          [noHighlightStyle]: !highlight,
        })}
        onMouseMove={() => {
          if (highlight) {
            (localDispatch || editingStore.dispatch)(
              EditingActionCreator.EDITION_HIGHLIGHT({ highlight: false }),
            );
          }
        }}
      >
        <JSONForm
          // Ugly workaround to force update JSONForm when config changes or entity changes
          key={JSON.stringify({ entity, config })}
          ref={form}
          value={val}
          schema={config}
          onChange={val => {
            setVal(val);
            onChange && onChange(val);
          }}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
