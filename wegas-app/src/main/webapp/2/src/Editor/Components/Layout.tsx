import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';
import PageEditor from './Page/PageEditor';

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
const ThemeEditor = React.lazy(() => import('../../Components/ThemeEditor'));

// import StateMachineEditor from './StateMachineEditor';
// import PageDisplay from './Page/PageDisplay';
// import TreeView from './Variable/VariableTree';
// import EntityEditor from './EntityEditor';
// import FileBrowserWithMeta from './FileBrowser/FileBrowser';
// import LibraryEditor from './ScriptEditors/LibraryEditor';
// import LanguageEditor from './LanguageEditor';
// import PlayLocal from './PlayLocal';
// import InstancesEditor from './Variable/InstancesEditor';
// import HTMLEditor from '../../Components/HTMLEditor';
// import ThemeEditor from '../../Components/ThemeEditor';

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

export const availableLayoutTabs = {
  Variables: <TreeView />,
  Page: <PageDisplay />,
  StateMachine: <StateMachineEditor />,
  Editor: <EntityEditor />,
  Files: <FileBrowserWithMeta />,
  Scripts: <LibraryEditor />,
  LanguageEditor: <LanguageEditor />,
  PlayLocal: <PlayLocal />,
  InstancesEditor: <InstancesEditor />,
  TestHTMLEditor: (
    <HTMLEditor value={'<div class="testClass">Testing testClass</div>'} />
  ),
  ThemeEditor: <ThemeEditor />,
  PageEditor2: <PageEditor />,
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
      <div className={layout}>
        <Header />
        <DndLinearLayout
          tabs={availableLayoutTabs}
          layout={[
            ['Variables'],
            [
              ['PlayLocal', 'Page'],
              [['StateMachine'], ['Files']],
            ],
            ['Editor'],
          ]}
        />
      </div>
    );
  }
}
