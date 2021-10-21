import * as React from 'react';
import { ActionCreator } from '../../../data/actions';
import { State } from '../../../data/Reducer/reducers';
import { store, useStore } from '../../../data/Stores/store';
import {
  defaultPageCTX,
  pageCTX,
} from '../../../Editor/Components/Page/PageEditor';
import { PageLoader } from '../../../Editor/Components/Page/PageLoader';
import {
  PageLoaderComponentProps,
  PAGE_LOADER_COMPONENT_TYPE,
} from '../../../Helper/pages';
import { createScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

type PlayerPageLoaderProps = WegasComponentProps & PageLoaderComponentProps;

const defaultPageAsScript = () =>
  createScript(JSON.stringify(store.getState().pages.index.defaultPageId));

function PlayerPageLoader({
  initialSelectedPageId = defaultPageAsScript(),
  name,
  context = {},
  className,
  style,
  id,
  loadTimer,
  options,
}: PlayerPageLoaderProps) {
  const pageScriptSelector = React.useCallback(
    (s: State) => {
      if (name != null) {
        return s.global.pageLoaders[name];
      }
    },
    [name],
  );
  let pageScript = useStore(pageScriptSelector);

  const { pageIdPath } = React.useContext(pageCTX);
  if (name != null && !pageScript) {
    store.dispatch(
      ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
        name,
        pageId: initialSelectedPageId,
      }),
    );
    pageScript = initialSelectedPageId;
  }
  const pageId = (useScript(pageScript, context) as string | undefined) || '';

  return pageIdPath.includes(pageId) ? (
    <pre className={className} style={style} id={id}>
      Page {pageId} recursion
    </pre>
  ) : (
    <pageCTX.Provider
      value={{
        ...defaultPageCTX,
        pageIdPath: [...pageIdPath, pageId],
      }}
    >
      <PageLoader
        className={className}
        style={style}
        id={id}
        selectedPageId={pageId}
        loadTimer={loadTimer}
        context={context}
        disabled={options.disabled}
        readOnly={options.readOnly}
      />
    </pageCTX.Provider>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerPageLoader,
    componentType: 'Layout',
    name: PAGE_LOADER_COMPONENT_TYPE,
    icon: 'window-maximize',
    illustration: 'pageLoader',
    schema: {
      initialSelectedPageId: schemaProps.pageSelect({ label: 'Page' }),
      loadTimer: schemaProps.number({ label: 'Loading timer (ms)' }),
      ...classStyleIdShema,
    },
    getComputedPropsFromVariable: () => ({
      initialSelectedPageId: defaultPageAsScript(),
    }),
  }),
);
