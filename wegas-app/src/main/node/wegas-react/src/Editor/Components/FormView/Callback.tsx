import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import {
  createScriptCallback,
  iScriptArgsToCallbackArgs,
  ScriptCallback,
} from '../../../Components/Hooks/useScript';
import { flex } from '../../../css/classes';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface CallbackViewView extends LabeledView, CommonView {
  callbackProps: {
    returnType?: string[];
    args?: [string, string[]][];
  };
}

export interface CallbackViewProps
  extends WidgetProps.BaseProps<CallbackViewView> {
  value?: ScriptCallback;
  onChange: (code?: ScriptCallback) => void;
}

export default function CallbackView(props: CallbackViewProps): JSX.Element {
  const { errorMessage, view, onChange, value } = props;
  const { label, description, callbackProps } = view;

  const valueRef = React.useRef(value);
  valueRef.current = value;

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

  return (
    <CommonViewContainer errorMessage={errorMessage} view={view}>
      <Labeled label={label} description={description}>
        {({ labelNode }) => (
          <>
            <div className={flex}>{labelNode}</div>
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
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
