import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';
import StateMachineEditor from './StateMachineEditor';
import PageDisplay from './Page/PageDisplay';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';
import { FileBrowserWithMeta } from './FileBrowser/FileBrowser';
import LibraryEditor from './ScriptEditors/LibraryEditor';

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

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
        <Header />
        <DndLinearLayout
          tabMap={{
            Variables: <TreeView />,
            Page: <PageDisplay />,
            StateMachine: <StateMachineEditor />,
            Editor: <Editor />,
            Files: <FileBrowserWithMeta />,
            Scripts: <LibraryEditor />,
          }}
          layoutMap={{
            rootKey: '0',
            lastKey: '3',
            isDragging: false,
            layoutMap: {
              '0': {
                type: 'ReflexLayoutNode',
                vertical: false,
                children: ['1', '2', '3'],
              },
              '1': {
                type: 'TabLayoutNode',
                vertical: false,
                children: ['Variables'],
              },
              '2': {
                type: 'TabLayoutNode',
                vertical: false,
                children: ['Files', 'Page', 'StateMachine'],
              },
              '3': {
                type: 'TabLayoutNode',
                vertical: false,
                children: ['Editor'],
              },
            },
          }}
        />
      </div>
    );
  }
}
