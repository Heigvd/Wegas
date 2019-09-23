import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { FeatureProvider } from '../../Components/FeatureProvider';
import { Item, Layout, DndLinearLayout } from './LinearTabLayout/LinearLayout';
import { ReflexContainer, ReflexElement } from 'react-reflex';

const StateMachineEditor = React.lazy(() => import('./StateMachineEditor'));
const PageDisplay = React.lazy(() => import('./Page/PageDisplay'));
const TreeView = React.lazy(() => import('./Variable/VariableTree'));
const Editor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(() =>
  import('./FileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));
const HTMLEditor = React.lazy(() => import('../../Components/HTMLEditor'));
const LanguageEditor = React.lazy(() => import('./LanguageEditor'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

function TestReFlex() {
  return (
    <ReflexContainer orientation={'vertical'}>
      <ReflexElement>
        <div>asljdfkajs</div>
      </ReflexElement>
    </ReflexContainer>
  );
}

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
    const TestEditor = () => (
      <>
        <HTMLEditor
          value={'<div>Tadaaaaaa</div>'}
          onChange={val => alert('CHANGE : ' + val)}
          onSave={val => alert('SAVE : ' + val)}
        />
        <HTMLEditor
          value={'<div>Blablaaaa</div>'}
          onChange={val => alert('CHANGE : ' + val)}
          onSave={val => alert('SAVE : ' + val)}
        />
      </>
    );

    return (
      <FeatureProvider>
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
              <Item key="TestEditor" label="TestEditor">
                <TestEditor />
              </Item>,
              <Item key="LanguageEditor" label="LanguageEditor">
                <LanguageEditor />
              </Item>,
              <Item key="TestReFlex" label="TestReFlex">
                <TestReFlex />
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
              <Item label="TestEditor">
                <TestEditor />
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
              <Item key="TestReFlex" label="TestReFlex">
                <TestReFlex />
              </Item>
              <Item label="LanguageEditor">
                <LanguageEditor />
              </Item>
            </Layout>
          </DndLinearLayout>
        </div>
      </FeatureProvider>
    );
  }
}
