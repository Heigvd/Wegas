import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';
import PageDisplay from './Page/PageDisplay';
import { TabLayout } from '../../Components/Tabs';
import StateMachineEditor from './StateMachineEditor';
import { DndConnectedFileBrowser } from './FileBrowser/TreeFileBrowser/FileBrowser';
import LibraryEditor from './ScriptEditors/LibraryEditor';
import { HTMLEditor } from '../../Components/HTMLEditor';

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
          <TabLayout
            tabs={['HTML', 'Page', 'StateMachine', 'Scripts', 'Files']}
          >
            <HTMLEditor
              value={'<div>Tadaaaaaa</div>'}
              onChange={val => alert('CHANGE : ' + val)}
              onSave={val => alert('SAVE : ' + val)}
            />
            <PageDisplay />
            <StateMachineEditor />
            <LibraryEditor />
            <DndConnectedFileBrowser />
          </TabLayout>
        </div>
        <div>
          <Editor />
        </div>
      </div>
    );
  }
}
