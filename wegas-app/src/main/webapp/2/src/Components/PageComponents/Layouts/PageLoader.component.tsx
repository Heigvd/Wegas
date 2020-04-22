import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';
import { PageLoader } from '../../../Editor/Components/Page/PageLoader';
import {
  PageLoaderComponentProps,
  PAGE_LOADER_COMPONENT_TYPE,
} from '../../../Helper/pages';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { useStore, store } from '../../../data/store';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { ActionCreator } from '../../../data/actions';
import { createScript } from '../../../Helper/wegasEntites';

type PlayerPageLoaderProps = PageComponentMandatoryProps &
  PageLoaderComponentProps;

const defaultPageAsScript = () =>
  createScript(JSON.stringify(store.getState().pages.index.defaultPageId));

function PlayerPageLoader(props: PlayerPageLoaderProps) {
  const {
    ComponentContainer,
    childProps,
    containerProps,
    showBorders,
  } = extractProps(props);
  const { name, initialSelectedPageId = defaultPageAsScript() } = childProps;

  let pageScript = useStore(s => s.global.pageLoaders[name], deepDifferent);
  const { pageIdPath } = React.useContext(pageCTX);
  if (!pageScript) {
    store.dispatch(
      ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
        name,
        pageId: initialSelectedPageId,
      }),
    );
    pageScript = initialSelectedPageId;
  }
  const pageId = useScript(pageScript ? pageScript.content : '') as string;

  return (
    <ComponentContainer {...containerProps} showBorders={showBorders}>
      {pageIdPath.includes(pageId) ? (
        <pre>Page {pageId} recursion</pre>
      ) : (
        <pageCTX.Provider
          value={{
            editMode: false,
            showControls: false,
            showBorders: false,
            pageIdPath: [...pageIdPath, pageId],
            handles: {},
            onDrop: () => {},
            onDelete: () => {},
            onEdit: () => {},
            onUpdate: () => {},
          }}
        >
          <PageLoader selectedPageId={pageId} />
        </pageCTX.Provider>
      )}
    </ComponentContainer>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerPageLoader,
    PAGE_LOADER_COMPONENT_TYPE,
    'window-maximize',
    {
      name: schemaProps.string('Name', true),
      selectedPageId: schemaProps.pageSelect('Page', false),
    },
    [],
    () => ({
      name: 'Unamed',
      initialSelectedPageId: defaultPageAsScript(),
    }),
  ),
);
