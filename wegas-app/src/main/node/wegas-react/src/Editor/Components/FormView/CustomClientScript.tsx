import { css } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import {
  createClientScript,
  IClientScript,
} from '../../../Components/Hooks/useScript';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { scriptEditStyle } from './Script/Script';

export interface CustomClientScriptProps
  extends WidgetProps.BaseProps<
  LabeledView &
  CommonView & {
    returnType?: string[];
    args?: [string, string[]][];
  }
  > {
  value?: IClientScript;
  onChange: (code?: IClientScript) => void;
}

const currentStyle = css({
  fontWeight: 'bolder',
});

const otherStyle = css({
  cursor: 'pointer',
  ':hover': {
    textDecoration: 'underline',
  },
});

export function CustomClientScript({
  view,
  value,
  onChange,
}: CustomClientScriptProps) {
  const onScriptChange = React.useCallback(
    (val: string) => {
      onChange(createClientScript(val, value?.returnType));
    },
    [onChange, value?.returnType],
  );

  const onReturnTypeChange = React.useCallback(
    (returnType?: string) => {
      onChange(
        createClientScript(
          value?.content,
          returnType != 'void' ? returnType : undefined,
        ),
      );
    },
    [onChange, value?.content],
  );

  const mayReturnVoid = view.returnType?.includes('void');
  const multipleTypes = (view.returnType?.length ?? 0) > 1;

  const showSwitchType = mayReturnVoid && multipleTypes;
  const withoutVoid = (view.returnType || [])
    .filter(x => x !== 'void')
    .join(' | ');

  const effective =
    value?.returnType && value?.returnType != 'void'
      ? value.returnType
      : 'void';

  return (
    <CommonViewContainer view={ view }>
      <Labeled label={ view.label } description={ view.description } /*{...view}*/>
        { ({ labelNode }) => {
          return (
            <>
              { labelNode }
              { showSwitchType && (
                <div className={css({padding:'0 0 10px 10px'})}>
                  Return type:
                  <div className={ css({ display: 'flex', gap: '10px' }) }>
                    <div
                      className={ effective === 'void' ? currentStyle : otherStyle }
                      onClick={ () => {
                        onReturnTypeChange();
                      } }
                    >
                    { effective === 'void' ? "⬤" : "◯"} void
                    </div>
                    <div
                      className={ effective !== 'void' ? currentStyle : otherStyle }
                      onClick={ () => {
                        onReturnTypeChange(withoutVoid);
                      } }
                    >
                    { effective !== 'void' ? "⬤" : "◯"} { withoutVoid }
                    </div>
                  </div>
                </div>
              ) }
              <div className={ scriptEditStyle }>
                <TempScriptEditor
                  key={ effective }
                  language="typescript"
                  returnType={(value?.returnType && value.returnType != 'void') ? [value.returnType] : [] }
                  args={ view.args }
                  initialValue={ value ? value.content : '' }
                  onChange={ onScriptChange }
                  minimap={ false }
                  noGutter={ true }
                  resizable
                />
              </div>
            </>
          );
        } }
      </Labeled>
    </CommonViewContainer>
  );
}
