import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { FlexItem } from '../../../Components/Layouts/FlexList';
import { TextLoader, TumbleLoader } from '../../../Components/Loader';
import { PageDeserializer } from '../../../Components/PageComponents/tools/PageDeserializer';
import { themeCTX, ThemeProvider } from '../../../Components/Theme/Theme';
import { SelectedThemes } from '../../../Components/Theme/ThemeVars';
import { expandBoth, flex } from '../../../css/classes';
import { State } from '../../../data/Reducer/reducers';
import { useIsReadyForPageDisplay } from '../../../data/selectors/InitStatusesSelector';
import { useStore } from '../../../data/Stores/store';
import { classNameOrEmpty } from '../../../Helper/className';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import ResizeObserver from 'resize-observer-polyfill';

export const PAGE_LOADER_DEFAULT_ID = 'PAGE_LOADER_DEFAULT_ID';
export const PAGE_LOADER_CLASS = 'wegas-pageloader';

/**
 * main page loaders (ie editor/host tabs which laod pages, player main view) expose their size by default.
 * Others (ie subpage laoder) shall not use any default value)
 *  */
export const MAIN_PAGE_EXPOSE_SIZE_AS = 'mainPageSize';

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
  themeContext?: keyof SelectedThemes;
  themeMode?: string;
  loadTimer?: number;
  context?: {
    [name: string]: unknown;
  };
  disabled?: boolean;
  readOnly?: boolean;
  exposeSizeAs?: string;
}

const voidObject = {};

export function PageLoader({
  selectedPageId,
  themeContext,
  themeMode,
  className,
  style,
  id = PAGE_LOADER_DEFAULT_ID,
  loadTimer = 0,
  context = voidObject,
  disabled,
  readOnly,
  exposeSizeAs,
}: PageLoaderProps) {
  const i18nCommonValues = useInternalTranslate(commonTranslations);
  const i18nPagesValues = useInternalTranslate(pagesTranslations);
  const selectedPageSelector = React.useCallback(
    (s: State) => (selectedPageId ? s.pages[selectedPageId] : undefined),
    [selectedPageId],
  );
  const selectedPage = useStore(selectedPageSelector, deepDifferent);
  const { currentContext, currentMode } = React.useContext(themeCTX);

  const [waiting, setWaiting] = React.useState(false);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (loadTimer != null && loadTimer > 0) {
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

  const isReady = useIsReadyForPageDisplay();

  const [size, setSize] = React.useState<{ width: number; height: number }>();

  const newContext = React.useMemo(() => {
    if (context && exposeSizeAs) {
      return {
        ...context,
        [exposeSizeAs]: {
          ...size,
        },
      };
    } else {
      return context;
    }
  }, [context, exposeSizeAs, size]);

  const resizeObserver = React.useRef<ResizeObserver | undefined>();

  const setRef = React.useCallback((element: HTMLDivElement | null) => {

    if (resizeObserver.current != null) {
      resizeObserver.current.disconnect();
      resizeObserver.current = undefined;
    }

    if (element != null) {
      //n.current = element;

      const ro = new ResizeObserver(() => {
        if (element != null) {
          const rect = element.getBoundingClientRect();
          setSize({
            height: rect.height,
            width: rect.width,
          });
        }
      });

      ro.observe(element);
      resizeObserver.current = ro;
    }
  }, []);


  return (
    <DefaultDndProvider>
      <ThemeProvider
        contextName={themeContext || currentContext}
        modeName={themeMode || currentMode}
      >
        <React.Suspense
          fallback={<TextLoader text={i18nCommonValues.buildingWorld} />}
        >
          <div
            ref={setRef}
            className={
              PAGE_LOADER_CLASS +
              ' ' +
              cx(flex, expandBoth) +
              classNameOrEmpty(className)
            }
            style={style}
            id={id}
          >
            {isReady &&
              (selectedPage ? (
                <PageDeserializer
                  pageId={selectedPageId}
                  Container={FlexItem}
                  dropzones={voidObject}
                  context={newContext}
                  inheritedOptionsState={inheritedOptionsState}
                />
              ) : (
                <pre>{i18nPagesValues.pageUndefined}</pre>
              ))}
            {(waiting || !selectedPage || !isReady) && (
              // Petit tweak pour laisser la page se charger (si un scénario à un problème par contre, on verra le loader tourner éternellement)
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
