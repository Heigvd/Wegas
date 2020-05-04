import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider, themeVar } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/tools/PageDeserializer';
import { useStore } from '../../../data/store';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { css, cx } from 'emotion';
import { pageCTX } from './PageEditor';
import { flex } from '../../../css/classes';
import { wlog } from '../../../Helper/wegaslog';
import { useComparator } from '../../../Helper/react.debug';

const editStyle = css({
  borderStyle: 'solid',
  borderWidth: '30px',
  borderColor: themeVar.disabledColor,
});

interface PageLoaderProps {
  selectedPageId?: string;
}

export function PageLoader({ selectedPageId }: PageLoaderProps) {
  const selectedPage = useStore(
    s => (selectedPageId ? s.pages[selectedPageId] : undefined),
    deepDifferent,
  );
  const { editMode } = React.useContext(pageCTX);

  // React.useEffect(() => {
  //   wlog('mounted');
  //   return () => wlog('unmounted');
  // });

  // React.useEffect(() => {
  //   wlog('selectedPageId');
  // }, [selectedPageId]);

  // React.useEffect(() => {
  //   wlog('selectedPage');
  // }, [selectedPage]);

  // React.useEffect(() => {
  //   wlog('editMode');
  // }, [editMode]);

  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <div className={cx(flex, { [editStyle]: editMode })}>
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
