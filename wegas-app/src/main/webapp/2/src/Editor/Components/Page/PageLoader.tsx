import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/tools/PageDeserializer';
import { wlog } from '../../../Helper/wegaslog';

interface PageLoaderProps {
  selectedPage: Page;
}

export function PageLoader({ selectedPage }: PageLoaderProps) {
  wlog(selectedPage);
  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <div style={{ display: 'flex', height: '100%' }}>
            <PageDeserializer json={selectedPage} />
          </div>
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
