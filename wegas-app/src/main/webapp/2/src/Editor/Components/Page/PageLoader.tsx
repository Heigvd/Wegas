import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/PageDeserializer';

interface PageLoaderProps {
  selectedPage: Page;
}

export function PageLoader({ selectedPage }: PageLoaderProps) {
  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <PageDeserializer json={selectedPage} />
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
