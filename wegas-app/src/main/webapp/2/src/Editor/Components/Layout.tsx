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
const ThemeEditor = React.lazy(
  () => import('../../Components/Style/ThemeEditor'),
);

const Tester = React.lazy(() => import('../../Testers/SchemaPropsTester'));

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

export const availableLayoutTabs = {
  Variables: <TreeView />,
  'State Machine': <StateMachineEditor />,
  'Variable Properties': <EntityEditor />,
  Files: <FileBrowserWithMeta />,
  Scripts: <LibraryEditor />,
  'Language Editor': <LanguageEditor />,
  'Play Local': <PlayLocal />,
  'Play Server': <PlayServer />,
  'Instances Editor': <InstancesEditor />,
  Tester: <Tester />,
  'Theme Editor': <ThemeEditor />,
  'Page Editor': <PageEditor />,
} as const;

export type AvailableLayoutTab = keyof typeof availableLayoutTabs;

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
            [['Play Local'], [['State Machine'], ['Files']]],
            ['Variable Properties'],
          ]}
          layoutId={mainLayoutId}
        />
      </div>
    );
  }
}
