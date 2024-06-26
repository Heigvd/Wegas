/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import * as React from 'react';
import useTranslations, { I18nCtx } from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/notification';
import Button from './Button';
import Checkbox from './Checkbox';
import InlineLoading from './InlineLoading';
import Input from './Input';
import Toggler from './Toggler';

const PasswordStrengthBar = React.lazy(() => import('./password/PasswordStrengthBar'));

const hideBar = css({
  display: 'none',
});

export interface BaseField<T> {
  type: 'text' | 'textarea' | 'password' | 'boolean';
  key: keyof T;
  readonly?: boolean;
  label?: React.ReactNode;
  fieldFooter?: React.ReactNode;
  placeholder?: string;
  isMandatory: boolean;
  isErroneous?: (entity: T) => boolean;
  errorMessage?: React.ReactNode;
}

export interface TextualField<T> extends BaseField<T> {
  type: 'text' | 'textarea';
}

export interface PasswordFeedback {
  warning?: string;
  suggestions?: string[];
}
export interface PasswordField<T> extends BaseField<T> {
  type: 'password';
  showStrenghBar: boolean;
  strengthProp?: keyof T;
  feedbackProp?: keyof T;
  dynamicErrorMessage: (feedback: PasswordFeedback | undefined) => React.ReactNode;
}

export interface BooleanField<T> extends BaseField<T> {
  type: 'boolean';
  showAs: 'toggle' | 'checkbox';
}

//type: 'text' | 'password' | 'password_with_strength_bar' | 'toggle';

export type Field<T> = TextualField<T> | PasswordField<T> | BooleanField<T>;

export interface FormProps<T> {
  fields: Readonly<Field<Readonly<T>>>[];
  value: T;
  autoSubmit?: boolean;
  submitLabel?: string;
  onSubmit: (entity: T) => void;
  children?: React.ReactNode;
}

export default function Form<T>({
  fields,
  value,
  submitLabel,
  onSubmit,
  children,
  autoSubmit = false,
}: FormProps<T>): JSX.Element {
  const i18n = useTranslations();
  const { lang } = React.useContext(I18nCtx);
  const dispatch = useAppDispatch();

  const [state, setState] = React.useState<T>(value);
  const [erroneous, setErroneous] = React.useState(false);

  let globalErroneous = false;

  const setFormValue = React.useCallback(
    (key: keyof T, value: unknown) => {
      // genuine hack inside: use setState as getter
      setState(s => {
        const newState = { ...s, [key]: value };
        if (autoSubmit) {
          onSubmit(newState);
        }
        return newState;
      });
    },
    [autoSubmit, onSubmit],
  );

  const submitCb = React.useCallback(() => {
    if (!globalErroneous) {
      onSubmit(state);
    } else {
      setErroneous(true);
      dispatch(addNotification({ status: 'OPEN', type: 'WARN', message: i18n.pleaseProvideData }));
    }
  }, [state, onSubmit, dispatch, i18n.pleaseProvideData, globalErroneous]);

  const onEnterCb = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter') {
        submitCb();
      }
    },
    [submitCb],
  );

  const fieldComps = fields.map(field => {
    const isErroneous = field.isErroneous != null ? field.isErroneous(state) : false;
    globalErroneous = globalErroneous || isErroneous;
    const fieldKey = `field-${field.key}`;

    if (field.type == 'text' || field.type === 'textarea') {
      return (
        <div key={fieldKey}>
          <Input
            type="text"
            inputType={field.type === 'text' ? 'input' : 'textarea'}
            value={String(state[field.key] || '')}
            label={field.label}
            placeholder={field.placeholder}
            warning={erroneous && isErroneous ? field.errorMessage : undefined}
            mandatory={field.isMandatory}
            onChange={value => setFormValue(field.key, value)}
            readonly={field.readonly}
          />
          {field.fieldFooter != null ? field.fieldFooter : null}
        </div>
      );
    } else if (field.type === 'password') {
      return (
        <div key={fieldKey}>
          <Input
            type="password"
            value={String(state[field.key] || '')}
            label={field.label}
            placeholder={field.placeholder}
            warning={isErroneous && (String(state[field.key]) !== '' || erroneous) ? (field.key !== 'confirm' && field.feedbackProp)?field.dynamicErrorMessage(state[field.feedbackProp] as PasswordFeedback): field.errorMessage : undefined}
            mandatory={field.isMandatory}
            onChange={value => setFormValue(field.key, value)}
            readonly={field.readonly}
          />
          {field.fieldFooter != null ? field.fieldFooter : null}
          {/* if strength prop is set, always init the PasswordStrengthBar */}
          {field.strengthProp ? (
            <div className={field.showStrenghBar ? '' : hideBar}>
              <React.Suspense fallback={<InlineLoading />}>
                <PasswordStrengthBar
                  uiLanguage={lang}
                  barColors={['#ddd', '#ef4836', 'rgb(118, 176, 232)', '#2b90ef', '#01f590']}
                  scoreWordClassName={hideBar}
                  onChangeScore={(value, feedback) => {
                    if (field.strengthProp != null && field.feedbackProp != null) {
                      setFormValue(field.strengthProp, value);
                      setFormValue(field.feedbackProp, feedback);
                    }
                  }}
                  password={String(state[field.key] || '')}
                />
              </React.Suspense>
            </div>
          ) : null}
        </div>
      );
    } else if (field.type === 'boolean') {
      const blnValue = state[field.key] as unknown as boolean;
      return (
        <div key={fieldKey}>
          {field.showAs === 'toggle' ? (
            <Toggler
              value={blnValue}
              label={field.label}
              warning={erroneous && isErroneous ? field.errorMessage : undefined}
              onChange={value => setFormValue(field.key, value)}
              disabled={field.readonly}
            />
          ) : (
            <Checkbox
              value={blnValue}
              label={field.label}
              warning={erroneous && isErroneous ? field.errorMessage : undefined}
              onChange={value => setFormValue(field.key, value)}
              disabled={field.readonly}
            />
          )}
          {field.fieldFooter != null ? field.fieldFooter : null}
        </div>
      );
    }
  });

  return (
    <div
      className={css({
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
        '& > *': {
          padding: '8px 0',
        },
      })}
      onKeyDown={onEnterCb}
    >
      <div className={css({
        overflow: "auto"
      })}>
        <form>
          {fieldComps}
        </form>
      </div>
      {autoSubmit ? null : (
        <Button
          key="submit"
          label={submitLabel || i18n.submit}
          className={css({ alignSelf: 'flex-end' })}
          onClick={submitCb}
        />
      )}
      {children}
    </div>
  );
}
