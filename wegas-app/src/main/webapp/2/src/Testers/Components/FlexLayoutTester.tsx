import * as React from 'react';
import { useFlexLayout } from '../../Components/Layouts/FlexLayout';
import { cx } from 'emotion';
import { flex, flexColumn, grow } from '../../css/classes';

export default function FlexLayoutTester() {
  const {
    FlexLayout: HorizontalFlexLayout,
    Splitter: HorizontalSplitter,
    Content: HorizontalContent,
  } = useFlexLayout(false);
  const {
    FlexLayout: VerticalFlexLayout,
    Splitter: VerticalSplitter,
    Content: VerticalContent,
  } = useFlexLayout(true);

  return (
    <div className={cx(flex, flexColumn)}>
      <div className={grow}>
        Horizontal
        <HorizontalFlexLayout>
          <HorizontalContent>Horizontal 1</HorizontalContent>
          <HorizontalSplitter />
          <HorizontalContent>Horizontal 2</HorizontalContent>
        </HorizontalFlexLayout>
      </div>
      <div className={grow}>
        Vertical
        <VerticalFlexLayout>
          <VerticalContent>Vertical 1</VerticalContent>
          <VerticalSplitter />
          <VerticalContent>Vertical 2</VerticalContent>
        </VerticalFlexLayout>
      </div>
    </div>
  );
}
