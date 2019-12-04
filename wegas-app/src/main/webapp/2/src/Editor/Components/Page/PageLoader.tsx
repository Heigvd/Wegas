import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/AutoImport';
import { DnDComponent } from './ComponentPalette';

interface PageLoaderProps {
  selectedPage: Page;
  onDrop?: (dndComponent: DnDComponent, path: string[], index?: number) => void;
  onDelete?: (path: string[]) => void;
}

interface PageContext {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
}

export const pageCTX = React.createContext<PageContext>({
  editMode: false,
  setEditMode: () => {},
});

function PageEditToggler() {
  const { editMode, setEditMode } = React.useContext(pageCTX);
  return (
    <button onClick={() => setEditMode(!editMode)}>
      {editMode ? 'View mode' : 'Edit mode'}
    </button>
  );
}

export function PageContextToggler() {
  return (
    <PageContextProvider>
      <PageEditToggler />
    </PageContextProvider>
  );
}

export function PageContextProvider(props: React.PropsWithChildren<{}>) {
  const [editMode, setEditMode] = React.useState(false);
  return (
    <pageCTX.Provider
      value={{
        editMode,
        setEditMode,
      }}
    >
      <DefaultDndProvider>{props.children}</DefaultDndProvider>
    </pageCTX.Provider>
  );
}

export function PageLoader({
  selectedPage,
  onDrop,
  onDelete,
}: PageLoaderProps) {
  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <PageDeserializer
            json={selectedPage}
            onDrop={onDrop}
            onDelete={onDelete}
          />
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
