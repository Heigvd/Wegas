import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { FeatureProvider } from '../../Components/FeatureProvider';
import { Item, Layout, DndLinearLayout } from './LinearTabLayout/LinearLayout';

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

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export interface LayoutTabsProps {
  tab: string;
  path: string;
}

interface LayoutTabsMap {
  [id: string]: LayoutTabsProps;
}

export const layoutTabs = {
  Variables: { tab: 'Variables', path: './Variable/VariableTree' },
  PageDisplay: { tab: 'Page', path: './Page/PageDisplay' },
  StateMachineEditor: { tab: 'StateMachine', path: './StateMachineEditor' },
  EntityEditor: { tab: 'EntityEditor', path: './EntityEditor' },
  FileBrowserWithMeta: { tab: 'Files', path: './FileBrowser/FileBrowser' },
  LibraryEditor: { tab: 'Scripts', path: './ScriptEditors/LibraryEditor' },
  LanguageEditor: { tab: 'LanguageEditor', path: './LanguageEditor' },
  PlayLocal: { tab: 'PlayLocal', path: './PlayLocal' },
};

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
      <FeatureProvider>
        <div className={layout}>
          <Header />
          <DndLinearLayout
            // tabs={Object.keys(layoutTabs).map(key => {
            //   const Component = React.lazy(() => import(layoutTabs[key].path));
            //   return (
            //     <Item key={key} label={layoutTabs[key].tab}>
            //       <Component />
            //     </Item>
            //   );
            // })}
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
              <Item key="EntityEditor" label="EntityEditor">
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
            ]}
          >
            <Layout>
              <Item label="Variables">
                <TreeView />
              </Item>
            </Layout>
            <Layout>
              <Item label="PlayLocal">
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
              <Item label="EntityEditor">
                <EntityEditor />
              </Item>
              <Item label="Scripts">
                <LibraryEditor />
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
