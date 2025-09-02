import { cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { DropMenu } from '../../../Components/DropMenu';
import { flex, flexRow, grow } from '../../../css/classes';
import { State } from '../../../data/Reducer/reducers';
import { useStore } from '../../../data/Stores/store';
import {
  isPageLoaderComponent,
  isWegasComponent,
  PageLoaderComponentProps,
  visitComponents,
} from '../../../Helper/pages';
import { MessageString } from '../MessageString';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: string;
  onChange: (code: string) => void;
}

function pageLoadersSelector(s: State) {
  const loaders: DropMenuItem<{ pageId: string } & PageLoaderComponentProps>[] =
    [];
  Object.entries(s.pages)
    .filter(([, v]) => isWegasComponent(v))
    .map(([k, v]) =>
      // TS does not understand PageIndexes have been filtered out
      visitComponents(v as unknown as WegasComponent, c => {
        if (isPageLoaderComponent(c)) {
          loaders.push({
            label: c.props.name,
            value: {
              pageId: k,
              ...c.props,
            },
          });
        }
      }),
    );
  return loaders;
}

export default function PageLoaderSelect({
  onChange,
  view,
  errorMessage,
  value,
}: PageSelectProps) {
  const pageLoaders = useStore(pageLoadersSelector);

  const onPageLoaderChange = React.useCallback(
    (value?: string) => {
      if (value != null) {
        onChange(value);
      }
    },
    [onChange],
  );

  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div className={cx(flex, flexRow)} id={inputId}>
              {pageLoaders.length === 0 ? (
                <MessageString value="No page loader found" />
              ) : (
                <DropMenu
                  items={pageLoaders}
                  onSelect={item => {
                    onPageLoaderChange(item.value.name);
                  }}
                  label={value ?? 'Unknown page'}
                  containerClassName={grow}
                />
              )}
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
