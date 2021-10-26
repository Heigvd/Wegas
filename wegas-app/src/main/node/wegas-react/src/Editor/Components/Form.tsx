import { css, cx } from '@emotion/css';
import JSONForm, { Schema } from 'jsoninput';
import * as React from 'react';
import { DropMenu } from '../../Components/DropMenu';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { isActionAllowed } from '../../Components/PageComponents/tools/options';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { Toolbar } from '../../Components/Toolbar';
import {
  autoScroll,
  defaultMargin,
  defaultMarginBottom,
  defaultPaddingLeft,
  defaultPaddingRight,
  expandHeight,
  toolboxHeaderStyle,
} from '../../css/classes';
import { ActionsProps } from '../../data/Reducer/globalState';
import { wwarn } from '../../Helper/wegaslog';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import './FormView';
import { IconComp } from './Views/FontAwesome';

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

interface EditorProps<T> extends DisabledReadonly {
  entity?: T;
  update?: (variable: T) => void;
  actions: ActionsProps<T>[];
  path?: (string | number)[];
  config?: Schema;
  onChange?: (newEntity: T) => void;
  label?: React.ReactNode;
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
}: EditorProps<T>) {
  const oldReceivedEntity = React.useRef(entity);
  const form = React.useRef<JSONForm>(null);
  const [val, setVal] = React.useState(entity);
  const toolbox: ActionsProps<T>[] = actions.filter(
    a => a.sorting === 'toolbox',
  );
  const i18nValues = useInternalTranslate(commonTranslations);

  if (
    deepDifferent(entity, oldReceivedEntity.current) &&
    deepDifferent(entity, val)
  ) {
    oldReceivedEntity.current = entity;
    setVal(entity);
  }
  const closeAction = actions.find(a => a.sorting === 'close');
  const deleteAction = actions.find(a => a.sorting === 'delete');
  const duplicateAction = actions.find(a => a.sorting === 'duplicate');
  const findUsageAction = actions.find(a => a.sorting === 'findUsage');

  return (
    <Toolbar className={autoScroll}>
      <Toolbar.Header className={cx(toolboxContainerStyle, toolboxHeaderStyle)}>
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
            {/*
            Undo button in forms.
            Leaving it as a comment as it may be asked to re-add it.
            <ConfirmButton
              icon="undo"
              chipStyle
              tooltip={i18nValues.reset}
              onAction={accept => {
                accept && setVal(entity);
              }}
              disableBorders={{
                left: update !== undefined,
                right: actions.length > 0,
              }}
              buttonClassName={expandHeight}
            /> */}
            {deleteAction != null && deleteAction.confirm ? (
              <ConfirmButton
                icon="trash"
                chipStyle
                tooltip={i18nValues.delete}
                onAction={succes =>
                  succes && val != null && deleteAction.action(val, path)
                }
                buttonClassName={expandHeight}
              />
            ) : (
              <IconButton
                icon="trash"
                chipStyle
                tooltip={i18nValues.delete}
                onClick={() => val != null && deleteAction?.action(val, path)}
                className={expandHeight}
              />
            )}
            {duplicateAction != null && (
              <IconButton
                icon="clone"
                chipStyle
                tooltip={i18nValues.duplicate}
                onClick={() => val != null && duplicateAction.action(val, path)}
                className={expandHeight}
              />
            )}
            {findUsageAction != null && (
              <IconButton
                icon="search"
                chipStyle
                tooltip={String(findUsageAction.label)}
                onClick={() => val != null && findUsageAction.action(val, path)}
                className={expandHeight}
              />
            )}
            {toolbox.length > 0 && (
              <DropMenu
                items={toolbox || []}
                label={<IconComp icon="cog" />}
                onSelect={i => {
                  val != null && i.action(val, path);
                }}
                buttonClassName={toolboxButtonStyle}
              />
            )}
          </>
        )}
        {isActionAllowed({
          disabled,
          readOnly,
        }) &&
          closeAction != null && (
            <IconButton
              icon="times"
              tooltip={i18nValues.close}
              onClick={() => val != null && closeAction.action(val, path)}
            />
          )}
      </Toolbar.Header>
      <Toolbar.Content
        className={cx(autoScroll, defaultPaddingLeft, defaultPaddingRight)}
      >
        <div className={defaultMargin}>
          <h3 className={defaultMarginBottom}>{label}</h3>
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
