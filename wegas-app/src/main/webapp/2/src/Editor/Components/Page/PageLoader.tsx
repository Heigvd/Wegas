import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { deserialize } from '../../../Components/AutoImport';

interface PageLoaderProps {
  selectedPage: Page;
}

export function PageLoader({ selectedPage }: PageLoaderProps) {
  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          {deserialize(selectedPage)}
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
