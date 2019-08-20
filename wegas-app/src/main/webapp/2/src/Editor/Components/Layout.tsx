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

export type Features = 'ADVANCED' | 'INTERNAL' | 'DEBUG' | 'READONLY';
export const features: Features[] = [
  'ADVANCED',
  'INTERNAL',
  'DEBUG',
  'READONLY',
];
export const featuresCTX = React.createContext<{
  currentFeatures: Features[];
  setFeature: (feature: Features) => void;
  removeFeature: (feature: Features) => void;
}>({ currentFeatures: [], setFeature: () => {}, removeFeature: () => {} });

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export default function AppLayout() {
  const [features, setFeature] = React.useState<Features[]>([]);

  return (
    <div className={layout}>
      <featuresCTX.Provider
        value={{
          currentFeatures: features,
          setFeature: feature =>
            setFeature(oldFeatures => [...oldFeatures, feature]),
          removeFeature: feature =>
            setFeature(oldFeatures =>
              oldFeatures.filter(feat => feat !== feature),
            ),
        }}
      >
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
      </featuresCTX.Provider>
    </div>
  );
}
