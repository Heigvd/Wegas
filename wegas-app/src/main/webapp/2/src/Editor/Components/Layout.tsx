import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout, Item, Layout } from './LinearTabLayout/LinearLayout';

const StateMachineEditor = React.lazy(() => import('./StateMachineEditor'));
const PageDisplay = React.lazy(() => import('./Page/PageDisplay'));
const TreeView = React.lazy(() => import('./Variable/VariableTree'));
const Editor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(() =>
  import('./FileBrowser/TreeFileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));

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
          tabs={[
            <Item key="Variables" label="Variables">
              <TreeView />
            </Item>,
            <Item key="Page" label="Page">
              <PageDisplay />
            </Item>,
            <Item key="StateMachine" label="StateMachine">
              <StateMachineEditor />
            </Item>,
            <Item key="Editor" label="Editor">
              <Editor />
            </Item>,
            <Item key="Files" label="Files">
              <FileBrowserWithMeta />
            </Item>,
            <Item key="Scripts" label="Scripts">
              <LibraryEditor />
            </Item>,
          ]}
        >
          <Layout>
            <Item label="Variables">
              <TreeView />
            </Item>
          </Layout>
          <Layout>
            <Item label="Page">
              <PageDisplay />
            </Item>
            <Item label="StateMachine">
              <StateMachineEditor />
            </Item>
            <Item label="Files">
              <FileBrowserWithMeta />
            </Item>
          </Layout>
          <Layout>
            <Item label="Editor">
              <Editor />
            </Item>
            <Item label="Scripts">
              <LibraryEditor />
            </Item>
          </Layout>
        </DndLinearLayout>
      </div>
    );
  }
}
