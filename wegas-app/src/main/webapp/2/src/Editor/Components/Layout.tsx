import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';
import PageDisplay from './Page/PageDisplay';
import { TabLayout } from '../../Components/Tabs';
import StateMachineEditor from './StateMachineEditor';
import SrcEditor from './SrcEditor';
import { SizedDiv } from '../../Components/SizedDiv';

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
        <div>
          <TreeView />
        </div>
        <div>
          <TabLayout tabs={['Page', 'StateMachine', 'Test']}>
            <PageDisplay />
            <StateMachineEditor />
            <SrcEditor />
          </TabLayout>
        </div>
        <div>
          <Editor />
        </div>
      </div>
    );
  }
}
