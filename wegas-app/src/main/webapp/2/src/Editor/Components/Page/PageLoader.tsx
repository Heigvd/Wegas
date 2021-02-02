import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { ThemeProvider, themeCTX } from '../../../Components/Style/Theme';
import { TextLoader, TumbleLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/tools/PageDeserializer';
import { useStore } from '../../../data/Stores/store';
import { css, cx } from 'emotion';
import { flex, expandHeight } from '../../../css/classes';
import { themeVar } from '../../../Components/Style/ThemeVars';
import { FlexItem } from '../../../Components/Layouts/FlexList';
import { classNameOrEmpty } from '../../../Helper/className';
import { State } from '../../../data/Reducer/reducers';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';

const modalStyle = css({
  zIndex: 10000,
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.9)',
  transition: '2s background-color',
});

const loaderStyle = css({
  width: '200px',
  height: '200px',
});

const editStyle = css({
  borderStyle: 'solid',
  borderWidth: '5px',
  borderColor: themeVar.Common.colors.PrimaryColor,
  overflow: 'auto',
});

interface PageLoaderProps extends ClassStyleId {
  selectedPageId?: string;
  displayFrame?: boolean;
  themeMode?: string;
  loadTimer?: number;
  context?: {
    [name: string]: unknown;
  };
}

export function PageLoader({
  selectedPageId,
  displayFrame,
  themeMode,
  className,
  style,
  id,
  loadTimer = 0,
  context = {},
}: PageLoaderProps) {
  const selectedPageSelector = React.useCallback(
    (s: State) => (selectedPageId ? s.pages[selectedPageId] : undefined),
    [selectedPageId],
  );
  const selectedPage = useStore(selectedPageSelector, deepDifferent);
  const { currentContext, currentMode = themeMode } = React.useContext(
    themeCTX,
  );

  const [waiting, setWaiting] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loadTimer != null) {
      setWaiting(true);
      timeout = setTimeout(() => {
        setWaiting(false);
      }, loadTimer);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [loadTimer, selectedPageId]);

  return (
    <DefaultDndProvider>
      <ThemeProvider contextName={currentContext} modeName={currentMode}>
        <React.Suspense fallback={<TextLoader text="Building World!" />}>
          <div
            className={
              cx(flex, { [editStyle]: displayFrame }, expandHeight) +
              classNameOrEmpty(className)
            }
            style={style}
            id={id}
          >
            {selectedPage ? (
              <PageDeserializer
                pageId={selectedPageId}
                Container={FlexItem}
                dropzones={{}}
                context={context}
              />
            ) : (
              <pre>{`The page is undefined`}</pre>
            )}
            {((waiting && loadTimer != null) ||
              // Petit tweak pour laisser la page se charger (si un scénario à un problème par contre, on verra le loader tourner éternellement)
              !selectedPage) && (
              <div className={modalStyle}>
                <div className={loaderStyle}>
                  <TumbleLoader />
                </div>
              </div>
            )}
          </div>
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
