import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';
import { PageLoader } from '../../../Editor/Components/Page/PageLoader';
import {
  PageLoaderComponentProps,
  PAGE_LOADER_COMPONENT_TYPE,
} from '../../../Helper/pages';
import {
  pageCTX,
  defaultPageCTX,
} from '../../../Editor/Components/Page/PageEditor';
import { useStore, store } from '../../../data/store';
import { ActionCreator } from '../../../data/actions';
import { createScript } from '../../../Helper/wegasEntites';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdShema } from '../tools/options';
import { State } from '../../../data/Reducer/reducers';

type PlayerPageLoaderProps = WegasComponentProps & PageLoaderComponentProps;

const defaultPageAsScript = () =>
  createScript(JSON.stringify(store.getState().pages.index.defaultPageId));

function PlayerPageLoader({
  initialSelectedPageId = defaultPageAsScript(),
  name,
  context,
  className,
  style,
  id,
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
    schema: {
      initialSelectedPageId: schemaProps.pageSelect({ label: 'Page' }),
      ...classStyleIdShema,
    },
    getComputedPropsFromVariable: () => ({
      initialSelectedPageId: defaultPageAsScript(),
    }),
  }),
);
