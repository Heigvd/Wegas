import Form from 'jsoninput';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { AvailableSchemas } from '.';
import {
  computeCB,
  createScriptCallback,
  iScriptArgsToCallbackArgs,
  isScriptCallback,
  ScriptCallback,
} from '../../../Components/Hooks/useScript';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { flex } from '../../../css/classes';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface ScriptableCallbackViewView extends LabeledView, CommonView {
  callbackProps: {
    returnType?: string[];
    args?: [string, string[]][];
  };
  literalSchema: AvailableSchemas;
}

export interface ScriptableCallbackViewProps
  extends WidgetProps.BaseProps<ScriptableCallbackViewView> {
  value?: ScriptCallback | string;
  onChange: (code?: ScriptCallback | unknown) => void;
}

export default function ScriptableCallbackView(
  props: ScriptableCallbackViewProps,
): JSX.Element {
  const { errorMessage, view, onChange, value } = props;

  const { label, description, literalSchema, callbackProps } = view;

  const valueRef = React.useRef(value);
  valueRef.current = value;

  /**
   * Convert current value to IScript
   */
  const switchToScriptMode = React.useCallback(() => {
    let scripted;
    try {
      scripted = '(' + JSON.stringify(valueRef.current) + ')';
    } catch {
      scripted = valueRef.current;
    }
    if (isScriptCallback(scripted)) {
      onChange(scripted);
    } else {
      onChange(
        createScriptCallback(
          scripted,
          iScriptArgsToCallbackArgs(callbackProps.args),
        ),
      );
    }
  }, [callbackProps.args, onChange]);

  /**
   * Convert current value to IScript
   */
  const switchToLiteralMode = React.useCallback(() => {
    if (isScriptCallback(valueRef.current)) {
      const evaluated = computeCB(valueRef.current, undefined, undefined)();
      if (evaluated != null) {
        onChange(evaluated);
      } else {
        onChange(undefined);
      }
    }
  }, [onChange]);

  const onScriptContentChange = React.useCallback(
    (val: string) => {
      onChange(
        createScriptCallback(
          val,
          iScriptArgsToCallbackArgs(callbackProps.args),
        ),
      );
    },
    [callbackProps.args, onChange],
  );

  const isScript = isScriptCallback(value);

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => (
          <>
            <div className={flex}>
              {labelNode}
              <Button
                icon="code"
                onClick={isScript ? switchToLiteralMode : switchToScriptMode}
              />
            </div>
            {isScript ? (
              <TempScriptEditor
                language={'typescript'}
                returnType={callbackProps.returnType}
                args={callbackProps.args}
                initialValue={value ? value.content : ''}
                onChange={onScriptContentChange}
                minimap={false}
                noGutter={true}
                resizable
              />
            ) : (
              <Form schema={literalSchema} value={value} onChange={onChange} />
            )}
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
