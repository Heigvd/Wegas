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
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { ActionCreator } from '../../../data/actions';
import { createScript } from '../../../Helper/wegasEntites';
import { WegasComponentProps } from '../tools/EditableComponent';

type PlayerPageLoaderProps = WegasComponentProps & PageLoaderComponentProps;

const defaultPageAsScript = () =>
  createScript(JSON.stringify(store.getState().pages.index.defaultPageId));

function PlayerPageLoader({
  initialSelectedPageId = defaultPageAsScript(),
  name,
}: PlayerPageLoaderProps) {
  let pageScript = useStore(s => {
    if (name != null) {
      return s.global.pageLoaders[name];
    }
  }, deepDifferent);
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
  const pageId = useScript(pageScript ? pageScript.content : '') as string;

  return pageIdPath.includes(pageId) ? (
    <pre>Page {pageId} recursion</pre>
  ) : (
    <pageCTX.Provider
      value={{
        ...defaultPageCTX,
        pageIdPath: [...pageIdPath, pageId],
      }}
    >
      <PageLoader selectedPageId={pageId} />
    </pageCTX.Provider>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerPageLoader,
    PAGE_LOADER_COMPONENT_TYPE,
    'window-maximize',
    {
      name: schemaProps.string('Page', true),
      initialSelectedPageId: schemaProps.pageSelect('Page', false),
    },
    [],
    () => ({
      initialSelectedPageId: defaultPageAsScript(),
    }),
  ),
);
