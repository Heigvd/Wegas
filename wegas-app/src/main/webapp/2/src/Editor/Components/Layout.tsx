import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout } from './LinearTabLayout/LinearLayout';
import StateMachineEditor from './StateMachineEditor';
import PageDisplay from './Page/PageDisplay';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';
import { FileBrowserWithMeta } from './FileBrowser/TreeFileBrowser/FileBrowser';
import LibraryEditor from './ScriptEditors/LibraryEditor';
import { LanguageEditor } from './LanguageEditor';
import { FeatureProvider } from '../../Components/FeatureProvider';
import { Loader } from '../../Components/HOC/Loader';

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export default function AppLayout() {
  return (
    <div className={layout}>
      <FeatureProvider>
        <Header />
        <DndLinearLayout
          tabMap={{
            Variables: <TreeView />,
            Page: <PageDisplay />,
            StateMachine: <StateMachineEditor />,
            Editor: <Editor />,
            Files: <FileBrowserWithMeta />,
            Scripts: <LibraryEditor />,
            Languages: <LanguageEditor />,
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
                children: ['Languages', 'Page', 'StateMachine'],
              },
              '3': {
                type: 'TabLayoutNode',
                vertical: false,
                children: ['Editor'],
              },
            },
          }}
        />
      </FeatureProvider>
    </div>
  );
}
