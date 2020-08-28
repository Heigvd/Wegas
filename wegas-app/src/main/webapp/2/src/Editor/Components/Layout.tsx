import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';

const StateMachineEditor = React.lazy(() => import('./StateMachineEditor'));
const PageEditor = React.lazy(() => import('./Page/PageEditor'));
const TreeView = React.lazy(() => import('./Variable/VariableTree'));
const EntityEditor = React.lazy(() => import('./EntityEditor'));
const FileBrowserWithMeta = React.lazy(
  () => import('./FileBrowser/FileBrowser'),
);
const LibraryEditor = React.lazy(() => import('./ScriptEditors/LibraryEditor'));
const LanguageEditor = React.lazy(() => import('./LanguageEditor'));
const PlayLocal = React.lazy(() => import('./PlayLocal'));
const PlayServer = React.lazy(() => import('./PlayServer'));
const InstancesEditor = React.lazy(() => import('./Variable/InstancesEditor'));
const HTMLEditor = React.lazy(() => import('../../Components/HTMLEditor'));
const ThemeEditor = React.lazy(
  () => import('../../Components/Style/ThemeEditor'),
);

const Tester = React.lazy(
  () => import('../../Testers/Components/BooleanInputTester'),
);

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

export const availableLayoutTabs = {
  Variables: <TreeView />,
  StateMachine: <StateMachineEditor />,
  Editor: <EntityEditor />,
  Files: <FileBrowserWithMeta />,
  Scripts: <LibraryEditor />,
  LanguageEditor: <LanguageEditor />,
  PlayLocal: <PlayLocal />,
  PlayServer: <PlayServer />,
  InstancesEditor: <InstancesEditor />,
  TestHTMLEditor: (
    <HTMLEditor value={'<div class="testClass">Testing testClass</div>'} />
  ),
  Tester: <Tester />,
  ThemeEditor: <ThemeEditor />,
  PageEditor: <PageEditor />,
};

export const mainLayoutId = 'MainEditorLayout';

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
            [['PlayLocal'], [['StateMachine'], ['Files']]],
            ['Editor'],
          ]}
          layoutId={mainLayoutId}
        />
      </div>
    );
  }
}
