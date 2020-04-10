import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/tools/PageDeserializer';
import { PageAPI } from '../../../API/pages.api';
import { useWebsocket } from '../../../API/websocket';
import { useStore } from '../../../data/store';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';

interface PageLoaderProps {
  selectedPageId?: string;
}

export function PageLoader({ selectedPageId }: PageLoaderProps) {
  const selectedPage = useStore(
    s => (selectedPageId ? s.pages[selectedPageId] : undefined),
    deepDifferent,
  );
  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <div style={{ display: 'flex', height: '100%' }}>
            {selectedPage ? (
              <PageDeserializer json={selectedPage} />
            ) : (
              <pre>{`The page is undefined`}</pre>
            )}
          </div>
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}

interface PageIdLoaderProps {
  selectedPageId: string;
}

export function PageIdLoader({ selectedPageId }: PageIdLoaderProps) {
  const [selectedPage, setSelectedPage] = React.useState<WegasComponent>();
  React.useEffect(() => {
    PageAPI.get(selectedPageId).then(res => {
      setSelectedPage(Object.values(res)[0]);
    });
  }, [selectedPageId]);

  useWebsocket('PageUpdate', () =>
    PageAPI.get(selectedPageId).then(res => {
      setSelectedPage(Object.values(res)[0]);
    }),
  );

  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <div style={{ display: 'flex', height: '100%' }}>
            {selectedPage ? (
              <PageDeserializer json={selectedPage} />
            ) : (
              <pre>{`The page ${selectedPageId} is undefined`}</pre>
            )}
          </div>
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
