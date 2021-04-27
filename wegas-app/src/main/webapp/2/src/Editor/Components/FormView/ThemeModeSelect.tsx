import * as React from 'react';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { DropMenu } from '../../../Components/DropMenu';
import { cx } from 'emotion';
import { flex, flexRow, grow } from '../../../css/classes';
import { themeCTX } from '../../../Components/Style/Theme';
import { WidgetProps } from 'jsoninput/typings/types';

export interface ThemeModeSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: string;
  onChange: (code: string) => void;
}

export default function ThemeModeSelect({
  view,
  // value,
  value: mode,
  onChange,
  errorMessage,
}: ThemeModeSelectProps) {
  const { themesState, currentContext } = React.useContext(themeCTX);

  const modes =
    themesState.themes[themesState.selectedThemes[currentContext]].modes;

  const modesKeys: DropMenuItem<string>[] = Object.keys(modes).map(m => ({
    label: m,
    value: m,
  }));

  const modeDoesntExists = mode == null || modes[mode] == null;

  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div className={cx(flex, flexRow)} id={inputId}>
              <DropMenu
                items={modesKeys}
                // onSelect={item => {
                //   onNewMode(item.value);
                // }}
                onSelect={item => {
                  onChange(item.value);
                }}
                label={modeDoesntExists ? 'Unknown mode' : mode}
                containerClassName={grow}
              />
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
