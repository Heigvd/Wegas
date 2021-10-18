import * as React from 'react';
import JSONForm, { Schema } from 'jsoninput';
import { Toolbar } from '../../Components/Toolbar';
import {
  expandHeight,
  defaultMargin,
  defaultMarginBottom,
  defaultPaddingLeft,
  defaultPaddingRight,
  toolboxHeaderStyle,
  autoScroll,
} from '../../css/classes';
import './FormView';
import { wwarn } from '../../Helper/wegaslog';
import { ConfirmButton } from '../../Components/Inputs/Buttons/ConfirmButton';
import { deepDifferent } from '../../Components/Hooks/storeHookFactory';
import { isActionAllowed } from '../../Components/PageComponents/tools/options';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { DropMenu } from '../../Components/DropMenu';
import { css, cx } from '@emotion/css';
import { ActionsProps } from '../../data/Reducer/globalState';
import { IconComp } from './Views/FontAwesome';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { commonTranslations } from '../../i18n/common/common';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { MessageString } from './MessageString';

const closeButtonStyle = css({
  color: 'black',
});

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
  const toolbox: ActionsProps<T>[] = [];
  const i18nValues = useInternalTranslate(commonTranslations);

  if (
    deepDifferent(entity, oldReceivedEntity.current) &&
    deepDifferent(entity, val)
  ) {
    oldReceivedEntity.current = entity;
    setVal(entity);
  }

  return (
    <Toolbar
      className={autoScroll}
    >
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
            {actions.map((a, i) => {
              switch (a.sorting) {
                case 'toolbox':
                  toolbox.push(a);
                  break;
                case 'delete':
                  return a.confirm ? (
                    <ConfirmButton
                      key={i}
                      icon="trash"
                      chipStyle
                      tooltip={i18nValues.delete}
                      onAction={succes =>
                        succes && val != null && a.action(val, path)
                      }
                      buttonClassName={expandHeight}
                    />
                  ) : (
                    <IconButton
                      icon="trash"
                      chipStyle
                      tooltip={i18nValues.delete}
                      key={i}
                      onClick={() => val != null && a.action(val, path)}
                      className={expandHeight}
                    />
                  );
                case 'duplicate':
                  return (
                    <IconButton
                      icon="clone"
                      chipStyle
                      tooltip={i18nValues.duplicate}
                      key={i}
                      onClick={() => val != null && a.action(val, path)}
                      className={expandHeight}
                    />
                  );
                case 'findUsage':
                  return (
                    <IconButton
                      icon="search"
                      chipStyle
                      tooltip={String(a.label)}
                      key={i}
                      onClick={() => val != null && a.action(val, path)}
                      className={closeButtonStyle}
                    />
                  );
                case 'close':
                  return (
                    <IconButton
                      icon="times"
                      tooltip={i18nValues.close}
                      key={i}
                      onClick={() => val != null && a.action(val, path)}
                      className={closeButtonStyle}
                    />
                  );
                default:
                  toolbox.push(a);
                  break;
              }
            })}
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
        {deepDifferent(val, entity) ? (
          <MessageString type="warning" value={i18nValues.changesNotSaved} />
        ) : (
          <MessageString
            type="succes"
            value={i18nValues.changesSaved}
            duration={3000}
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content className={cx(autoScroll, defaultPaddingLeft, defaultPaddingRight)}>
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
