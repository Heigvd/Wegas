import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider, themeVar } from '../../../Components/Theme';
import { TextLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/tools/PageDeserializer';
import { useStore } from '../../../data/store';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { css, cx } from 'emotion';
import { pageCTX } from './PageEditor';
import { flex, expandHeight } from '../../../css/classes';

const editStyle = (editMode?: boolean) =>
  css({
    borderStyle: 'solid',
    borderWidth: '30px',
    borderColor: editMode ? themeVar.primaryHoverColor : themeVar.disabledColor,
    overflow: 'auto',
  });

interface PageLoaderProps {
  selectedPageId?: string;
  displayFrame?: boolean;
}

export function PageLoader({ selectedPageId, displayFrame }: PageLoaderProps) {
  const selectedPage = useStore(
    s => (selectedPageId ? s.pages[selectedPageId] : undefined),
    deepDifferent,
  );
  const { editMode } = React.useContext(pageCTX);

  return (
    <DefaultDndProvider>
      <ThemeProvider contextName="player">
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <div
            className={cx(
              flex,
              { [editStyle(editMode)]: displayFrame },
              expandHeight,
            )}
          >
            {selectedPage ? (
              <PageDeserializer pageId={selectedPageId} />
            ) : (
              <pre>{`The page is undefined`}</pre>
            )}
          </div>
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
