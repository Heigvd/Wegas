import { cx } from '@emotion/css';
import * as React from 'react';
import {
  cursorHelp,
  defaultMarginLeft,
  defaultMarginRight,
  expandBoth,
  flex,
  flexRow,
  itemCenter,
  justifyCenter,
} from '../../css/classes';
import { IconComp } from '../../Editor/Components/Views/FontAwesome';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { CheckBox } from '../Inputs/Boolean/CheckBox';
import { Button } from '../Inputs/Buttons/Button';

export const AuthorizationDataKey = 'WEGAS_AUTHORIZATIONS_DATA';

export interface AuthorizationData {
  allowExternalUrl?: boolean;
}

function getAuthorizationsFromLocalStorage(): AuthorizationData {
  try {
    return JSON.parse(window.localStorage.getItem(AuthorizationDataKey) || '');
  } catch (_e) {
    return { allowExternalUrl: undefined };
  }
}

export interface AuthorizationsContext {
  authorizations: AuthorizationData;
  setOrToggleAuthorization: (
    authorizationKey: keyof AuthorizationData,
    value?: boolean,
  ) => void;
}

const defaultAuthorizationContext: AuthorizationsContext = {
  authorizations: getAuthorizationsFromLocalStorage(),
  setOrToggleAuthorization: () => {},
};

export const authorizationsCTX = React.createContext<AuthorizationsContext>(
  defaultAuthorizationContext,
);

function AuthorizationContext({
  children,
}: React.PropsWithChildren<UknownValuesObject>) {
  const [authorizations, setAuthorizations] = React.useState<AuthorizationData>(
    defaultAuthorizationContext.authorizations,
  );

  const setOrToggleAuthorization = React.useCallback(
    (authorizationKey: keyof AuthorizationData, value?: boolean) => {
      setAuthorizations(o => {
        const newAuthorizations: AuthorizationData = {
          ...o,
          [authorizationKey]: value == null ? !o[authorizationKey] : value,
        };
        window.localStorage.setItem(
          AuthorizationDataKey,
          JSON.stringify(newAuthorizations),
        );
        return newAuthorizations;
      });
    },
    [],
  );

  return (
    <authorizationsCTX.Provider
      value={{ authorizations, setOrToggleAuthorization }}
    >
      {children}
    </authorizationsCTX.Provider>
  );
}

export const AuthorizationProvider = React.memo(AuthorizationContext);

export function useAuthorizations() {
  const i18nValues = useInternalTranslate(commonTranslations);
  const { authorizations, setOrToggleAuthorization } =
    React.useContext(authorizationsCTX);

  return {
    label: i18nValues.authorizations.authorizationsText,
    items: Object.entries(authorizations).map(
      ([k, v]: [keyof AuthorizationData, boolean]) => ({
        value: k,
        label: (
          <div
            onClick={e => {
              e.stopPropagation();
              setOrToggleAuthorization(k);
            }}
            className={cx(flex, flexRow, itemCenter)}
          >
            <CheckBox
              value={v}
              onChange={() => setOrToggleAuthorization(k)}
              label={i18nValues.authorizations.authorizations[k]?.label}
              horizontal
            />
            <div
              title={i18nValues.authorizations.authorizations[k]?.description}
              className={cx(cursorHelp, defaultMarginLeft)}
            >
              <IconComp icon="info-circle" />
            </div>
          </div>
        ),
        noCloseMenu: true,
      }),
    ),
  };
}

interface AuthorizationMessageProps {
  authorizationKey: keyof AuthorizationData;
  message?: string;
}

export function Authorization({
  authorizationKey,
  message,
  children,
}: React.PropsWithChildren<AuthorizationMessageProps>) {
  const i18nValues = useInternalTranslate(commonTranslations);

  const { authorizations, setOrToggleAuthorization } =
    React.useContext(authorizationsCTX);

  const authorization = authorizations[authorizationKey];

  if (authorization) {
    return <>{children}</>;
  } else {
    return (
      <div className={cx(flex, flexRow, expandBoth, justifyCenter, itemCenter)}>
        <div>
          <h3>{i18nValues.authorizations.authorizationNeeded}</h3>
          <h4>
            {i18nValues.authorizations.authorizations[authorizationKey]?.label}
          </h4>
          <p>
            {
              i18nValues.authorizations.authorizations[authorizationKey]
                ?.description
            }
          </p>
          {message != null && <p>{message}</p>}
          <div className={cx(flex, justifyCenter)}>
            <Button
              label="Accept"
              onClick={() => setOrToggleAuthorization(authorizationKey, true)}
              className={defaultMarginRight}
            />
            <Button
              label="Refuse"
              onClick={() => setOrToggleAuthorization(authorizationKey, false)}
              className={defaultMarginRight}
            />
          </div>
        </div>
      </div>
    );
  }
}
