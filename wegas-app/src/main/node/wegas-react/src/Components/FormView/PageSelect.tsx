import { cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { flex, flexRow, grow } from '../../css/classes';
import { State } from '../../data/Reducer/reducers';
import { useStore } from '../../data/Stores/store';
import { getPageIndexItem, indexToTree, isPageItem } from '../../Helper/pages';
import { DropMenu } from '../DropMenu';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: string;
  onChange: (code: string) => void;
}

function pageIndexSelector(s: State) {
  return s.pages.index;
}

export default function PageSelect({
  value,
  onChange,
  view,
  errorMessage,
}: PageSelectProps) {
  const index = useStore(pageIndexSelector);

  const onPageChange = React.useCallback(
    (value?: string) => {
      if (value != null) {
        onChange(value);
      }
    },
    [onChange],
  );

  const pageItem =
    value == null
      ? undefined
      : (getPageIndexItem(index, value) as PageIndexItem);

  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div className={cx(flex, flexRow)} id={inputId}>
              <DropMenu
                items={indexToTree(index)}
                selected={pageItem}
                onSelect={item =>
                  isPageItem(item.value) && onPageChange(item.value.id)
                }
                label={pageItem?.name || 'Unknown page'}
                containerClassName={grow}
              />
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
