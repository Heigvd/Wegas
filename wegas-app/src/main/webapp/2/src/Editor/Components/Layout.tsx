import * as React from 'react';
import { css, cx } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';

const layout = css({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  height: '100%',
  gridTemplateColumns: 'auto 1fr auto',
  '& > div': {
    boxSizing: 'border-box',
    borderRight: '1px solid',
  },
});

const flex = css({
  display: 'flex',
});

// const fullWidth = css({ gridColumnEnd: 'span 3' });
const fullWidth = css({ gridColumnEnd: 'span 3' });

export default class AppLayout extends React.Component<
  {},
  { editable: boolean }
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      editable: false,
    };
  }
  render() {
    return (
      <div className={layout}>
        <div className={fullWidth}>
          <Header />
        </div>
        <div className={cx(fullWidth, flex)}>
          <DndLinearLayout />
        </div>
      </div>
    );
  }
}
