import * as React from 'react';
import { css } from 'glamor';
import Header from './Header';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';
import PageDisplay from './Page/PageDisplay';
// import GridDemo from './GridDemo';

const layout = css({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  height: '100%',
  gridTemplateColumns: 'auto 1fr auto',
  '& > div': {
    boxSizing: 'border-box',
    border: '1px solid',
  },
});

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
      <div {...layout}>
        <div {...fullWidth}>
          <Header />
        </div>
        <div>
          <TreeView />
        </div>
        <div>
          <PageDisplay />
        </div>
        <div>
          <Editor />
        </div>
      </div>
    );
  }
}
