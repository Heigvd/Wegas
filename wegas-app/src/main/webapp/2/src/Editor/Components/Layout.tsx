import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { FeatureProvider } from '../../Components/FeatureProvider';
import { Item, Layout, DndLinearLayout } from './LinearTabLayout/LinearLayout';
import { ClassesProvider } from '../../Components/ClassesContext';

const StateMachineEditor = React.lazy(() => import('./StateMachineEditor'));
const PageDisplay = React.lazy(() => import('./Page/PageDisplay'));
const TreeView = React.lazy(() => import('./Variable/VariableTree'));
const EntityEditor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(() =>
  import('./FileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));
const LanguageEditor = React.lazy(() => import('./LanguageEditor'));
const PlayLocal = React.lazy(() => import('./PlayLocal'));
const InstancesEditor = React.lazy(() => import('./Variable/InstancesEditor'));
const HTMLEditor = React.lazy(() => import('../../Components/HTMLEditor'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
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
              <EntityEditor />
            </Item>,
            <Item key="Files" label="Files">
              <FileBrowserWithMeta />
            </Item>,
            <Item key="Scripts" label="Scripts">
              <LibraryEditor />
            </Item>,
            <Item key="LanguageEditor" label="LanguageEditor">
              <LanguageEditor />
            </Item>,
            <Item key="PlayLocal" label="PlayLocal">
              <PlayLocal />
            </Item>,
            <Item key="InstancesEditor" label="InstancesEditor">
              <InstancesEditor />
            </Item>,
            <Item key="TestHTMLEditor" label="TestHTMLEditor">
              <HTMLEditor
                value={'<div class="testClass">Testing testClass</div>'}
              />
            </Item>,
          ]}
        >
          <Layout>
            <Item label="Variables">
              <TreeView />
            </Item>
          </Layout>
          <Layout>
            <Item key="PlayLocal" label="PlayLocal">
              <PlayLocal />
            </Item>
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
              <EntityEditor />
            </Item>
            <Item label="Scripts">
              <LibraryEditor />
            </Item>
            <Item label="LanguageEditor">
              <LanguageEditor />
            </Item>
            <Item label="InstancesEditor">
              <InstancesEditor />
            </Item>
          </Layout>
        </DndLinearLayout>
      </div>
    );
  }
}
