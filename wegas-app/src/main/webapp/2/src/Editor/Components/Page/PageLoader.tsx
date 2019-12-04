import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/AutoImport';
import { DnDComponent } from './ComponentPalette';
import { DndComponent } from 'react-dnd';

interface PageLoaderProps {
  selectedPage: Page;
  onDrop?: (dndComponent: DnDComponent, path: string[], index?: number) => void;
}

interface PageContext {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  onDrag: (dndComponent?: DnDComponent | null) => void;
  draggedComponent?: DnDComponent | null;
}

export const pageCTX = React.createContext<PageContext>({
  editMode: false,
  setEditMode: () => {},
  onDrag: () => {},
});

function PageContextProvider(props: React.PropsWithChildren<{}>) {
  const [editMode, setEditMode] = React.useState(false);
  const [draggedComponent, onDrag] = React.useState<DnDComponent | null>();
  return (
    <pageCTX.Provider
      value={{
        editMode,
        setEditMode,
        onDrag,
        draggedComponent,
      }}
    >
      <DefaultDndProvider>{props.children}</DefaultDndProvider>
    </pageCTX.Provider>
  );
}

export function PageLoader({ selectedPage, onDrop }: PageLoaderProps) {
  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <PageContextProvider>
          <React.Suspense fallback={<TextLoader text="Building World!" />}>
            <PageDeserializer json={selectedPage} onDrop={onDrop} />
          </React.Suspense>
        </PageContextProvider>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
