import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { FeatureProvider } from '../../Components/FeatureProvider';
import {
  Item,
  Layout,
  DndLinearLayout,
  LayoutTabsProps,
} from './LinearTabLayout/LinearLayout';

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

interface LayoutTabsMap {
  [id: string]: LayoutTabsProps;
}

export const layoutTabs: LayoutTabsMap = {
  Variables: { tab: 'Variables', content: TreeView },
  PageDisplay: { tab: 'Page', content: PageDisplay },
  StateMachineEditor: { tab: 'StateMachine', content: StateMachineEditor },
  EntityEditor: { tab: 'EntityEditor', content: EntityEditor },
  FileBrowserWithMeta: { tab: 'Files', content: FileBrowserWithMeta },
  LibraryEditor: { tab: 'Scripts', content: LibraryEditor },
  LanguageEditor: { tab: 'LanguageEditor', content: LanguageEditor },
  PlayLocal: { tab: 'PlayLocal', content: PlayLocal },
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
            tabs={Object.keys(layoutTabs).map(key => {
              const Component = layoutTabs[key].content;
              return (
                <Item key={key} label={layoutTabs[key].tab}>
                  <Component />
                </Item>
              );
            })}
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
