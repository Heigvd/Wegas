import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';
import PageDisplay from './Page/PageDisplay';
import { TabLayout } from '../../Components/Tabs';
import StateMachineEditor from './StateMachineEditor';
import { FileBrowser } from './FileBrowser/FileBrowser';
import { ApiFile } from '../../API/files.api';
import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

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
          {/* <TreeView /> */}
        </div>
        <div>
          <TabLayout tabs={['Page', 'StateMachine','File browser']}>
            <PageDisplay />
            <StateMachineEditor />
            <DragDropContextProvider backend={HTML5Backend}>
              <FileBrowser onClick={(file:ApiFile)=>{console.log(file)}} />
            </DragDropContextProvider>
          </TabLayout>
        </div>
        <div>
          <Editor />
        </div>
      </div>
    );
  }
}
