import { css, cx } from '@emotion/css';
import * as React from 'react';
import { flex, flexColumn, flexRow, grow, itemCenter } from '../../css/classes';
import { runLoadedScript } from '../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../data/selectors';
import { usePagesContextStateStore } from '../../data/Stores/pageContextStore';
import { store } from '../../data/Stores/store';
import { safeClientScriptEval } from '../Hooks/useScript';
import { ClientAndServerAction } from '../PageComponents/Inputs/tools';
import { assembleStateAndContext } from '../PageComponents/tools/EditableComponent';
import { clientAndServerScriptChoices } from '../PageComponents/tools/options';
import { schemaProps } from '../PageComponents/tools/schemaProps';
import { themeVar } from '../Theme/ThemeVars';
import { Button } from './Buttons/Button';

const validatorStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '5px',
});

const inputStyle = css({
  padding: '5px',
});

export interface ValidatorComponentProps {
  /**
   * validator - if true, will put a handle that will fire the change event
   */
  validator?: boolean;
  /**
   * onCancel - will be called if the modiofication is cancelled
   */
  onCancel?: IScript | ClientAndServerAction;
}

interface ValidateProps<T> extends DisabledReadonly {
  value: T;
  onValidate: (value: T) => void;
  onCancel: () => void;
  children: (value: T, onChange: (value: T) => void) => JSX.Element;
}

export function Validate<T>({
  value,
  onValidate,
  onCancel,
  children,
  disabled,
  readOnly,
}: ValidateProps<T>) {
  const [savedValue, setSavedValue] = React.useState<T>(value);

  React.useEffect(() => {
    setSavedValue(value);
  }, [value]);

  return (
    <div className={cx(flex, flexRow, itemCenter, validatorStyle)}>
      <div className={cx(grow, inputStyle)}>
        {children(savedValue, setSavedValue)}
      </div>
      <div className={cx(flex, flexColumn, inputStyle)}>
        <Button
          icon="times"
          onClick={() => onCancel()}
          disabled={disabled}
          readOnly={readOnly}
        />
        <Button
          icon="check"
          onClick={() => onValidate(savedValue)}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

/**
 * Detect an old onCancel value that was a IScript object
 * @param value
 */

function errorDetector(value?: object | null | undefined): boolean {
  return (
    value != null &&
    '@class' in value &&
    (value as IScript)['@class'] === 'Script'
  );
}

/**
 * Transform an IScript object into {client:Iscript} to avoid validatorSchema bad parsing
 * @param value
 */
function cleaningMethod(value?: object | null | undefined): object {
  if (value == null) {
    return {};
  } else {
    return {
      client: value,
    };
  }
}

const cleaning: CleaningHashmapMethods = {
  errorDetector,
  cleaningMethod,
};

export const validatorSchema = {
  validator: schemaProps.boolean({ label: 'Validator' }),
  onCancel: schemaProps.hashlist({
    label: 'On cancel action',
    required: false,
    choices: clientAndServerScriptChoices,
    cleaning,
  }),
};

function isOnCancelClientAndServerAction(
  onCancel?: IScript | ClientAndServerAction,
): onCancel is ClientAndServerAction {
  return onCancel != null && ('client' in onCancel || 'server' in onCancel);
}

export function useOnCancelAction(
  onCancel?: IScript | ClientAndServerAction,
  context?: {
    [name: string]: unknown;
  },
) {
  const client = isOnCancelClientAndServerAction(onCancel)
    ? onCancel.client
    : onCancel;
  const server = isOnCancelClientAndServerAction(onCancel)
    ? onCancel.server
    : undefined;

  const state = usePagesContextStateStore(s => s);

  const handleOnCancel = React.useCallback(() => {
    if (client) {
      safeClientScriptEval(client, context, undefined, state);
    }
    if (server) {
      store.dispatch(
        runLoadedScript(
          server,
          Player.selectCurrent(),
          undefined,
          assembleStateAndContext(context, state),
        ),
      );
    }
  }, [client, context, server, state]);

  return React.useMemo(() => {
    if (!onCancel || Object.keys(onCancel).length === 0) {
      return { handleOnCancel: () => {} };
    } else {
      return { client, server, handleOnCancel };
    }
  }, [client, handleOnCancel, onCancel, server]);
}
