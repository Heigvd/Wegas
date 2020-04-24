import * as React from 'react';
import { useFlexLayout } from '../../Components/Layouts/FlexLayout';
import { cx, css } from 'emotion';
import { flex, flexColumn, grow } from '../../css/classes';

export default function FlexLayoutTester() {
  const HorizontalFlexLayout = useFlexLayout(false);
  const VerticalFlexLayout = useFlexLayout(true);

  // debugger;

  return (
    <div className={cx(flex, flexColumn, css({ width: '100px' }))}>
      <div className={grow}>
        <HorizontalFlexLayout>
          <HorizontalFlexLayout.Content>
            Horizontal 1
          </HorizontalFlexLayout.Content>
          <HorizontalFlexLayout.Splitter />
          <HorizontalFlexLayout.Content>
            Horizontal 2
          </HorizontalFlexLayout.Content>
          <HorizontalFlexLayout.Splitter />
          <HorizontalFlexLayout.Content>
            Horizontal 3
          </HorizontalFlexLayout.Content>
        </HorizontalFlexLayout>
      </div>
      <div className={grow}>
        Vertical
        <VerticalFlexLayout>
          <VerticalFlexLayout.Content>Vertical 1</VerticalFlexLayout.Content>
          <VerticalFlexLayout.Splitter />
          <VerticalFlexLayout.Content>Vertical 2</VerticalFlexLayout.Content>
          <VerticalFlexLayout.Splitter />
          <VerticalFlexLayout.Content>Vertical 3</VerticalFlexLayout.Content>
        </VerticalFlexLayout>
      </div>
    </div>
  );
}
