import { css, cx } from '@emotion/css';
import * as React from 'react';
import { expandBoth, flex } from '../../css/classes';
import { State } from '../../data/Reducer/reducers';
import { useStore } from '../../data/Stores/store';
import { classNameOrEmpty } from '../../Helper/className';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { pagesTranslations } from '../../i18n/pages/pages';
import { DefaultDndProvider } from '../Contexts/DefaultDndProvider';
import { deepDifferent } from '../Hooks/storeHookFactory';
import { FlexItem } from '../Layouts/FlexList';
import { TextLoader, TumbleLoader } from '../Loader';
import { PageDeserializer } from '../PageComponents/tools/PageDeserializer';
import { themeCTX, ThemeProvider } from '../Theme/Theme';

export const PAGE_LOADER_DEFAULT_ID = 'PAGE_LOADER_DEFAULT_ID';
export const PAGE_LOADER_CLASS = 'wegas-pageloader';

export const fullScreenLoaderStyle = css({
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
  backgroundColor: '#FFF',
  transition: '2s background-color',
});

interface PageLoaderProps extends ClassStyleId {
  selectedPageId?: string;
  themeMode?: string;
  loadTimer?: number;
  context?: {
    [name: string]: unknown;
  };
  disabled?: boolean;
  readOnly?: boolean;
}

const voidObject = {};

export function PageLoader({
  selectedPageId,
  themeMode,
  className,
  style,
  id = PAGE_LOADER_DEFAULT_ID,
  loadTimer = 0,
  context = voidObject,
  disabled,
  readOnly,
}: PageLoaderProps) {
  const i18nCommonValues = useInternalTranslate(commonTranslations);
  const i18nPagesValues = useInternalTranslate(pagesTranslations);
  const selectedPageSelector = React.useCallback(
    (s: State) => (selectedPageId ? s.pages[selectedPageId] : undefined),
    [selectedPageId],
  );
  const selectedPage = useStore(selectedPageSelector, deepDifferent);
  const { currentContext, currentMode = themeMode } =
    React.useContext(themeCTX);

  const [waiting, setWaiting] = React.useState(false);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
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

  const inheritedOptionsState = React.useMemo(() => {
    return {
      disabled,
      readOnly,
    };
  }, [disabled, readOnly]);

  return (
    <DefaultDndProvider>
      <ThemeProvider contextName={currentContext} modeName={currentMode}>
        <React.Suspense
          fallback={<TextLoader text={i18nCommonValues.buildingWorld} />}
        >
          <div
            className={
              PAGE_LOADER_CLASS +
              ' ' +
              cx(flex, expandBoth) +
              classNameOrEmpty(className)
            }
            style={style}
            id={id}
          >
            {selectedPage ? (
              <PageDeserializer
                pageId={selectedPageId}
                Container={FlexItem}
                dropzones={voidObject}
                context={context}
                inheritedOptionsState={inheritedOptionsState}
              />
            ) : (
              <pre>{i18nPagesValues.pageUndefined}</pre>
            )}
            {((waiting && loadTimer != null) ||
              // Petit tweak pour laisser la page se charger (si un scénario à un problème par contre, on verra le loader tourner éternellement)
              !selectedPage) && (
              <div className={fullScreenLoaderStyle}>
                <TumbleLoader />
              </div>
            )}
          </div>
        </React.Suspense>
      </ThemeProvider>
    </DefaultDndProvider>
  );
}
