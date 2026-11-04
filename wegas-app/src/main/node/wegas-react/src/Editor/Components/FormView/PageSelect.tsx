import { cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { DropMenu } from '../../../Components/DropMenu';
import { flex, flexRow, grow } from '../../../css/classes';
import {
  getPageIndexItem,
  indexToTree,
  isPageItem,
} from '../../../Helper/pages';
import { shallowEqual, useAppSelector } from '../../../store/hooks';
import { selectPageIndex } from '../../../store/slices/pages';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: string;
  onChange: (code: string) => void;
}

export default function PageSelect({
  value,
  onChange,
  view,
  errorMessage,
}: PageSelectProps) {
  const index = useAppSelector(selectPageIndex, shallowEqual);

  const onPageChange = React.useCallback(
    (value?: string) => {
      if (value != null) {
        onChange(value);
      }
    },
    [onChange],
  );

  const pageItem =
    value == null || index == undefined
      ? undefined
      : getPageIndexItem(index, value);

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
