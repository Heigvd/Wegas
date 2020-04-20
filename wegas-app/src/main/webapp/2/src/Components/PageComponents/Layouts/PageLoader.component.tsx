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
import { deepDifferent, shallowDifferent } from '../../Hooks/storeHookFactory';
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

  let pageScript = useStore(s => {
    const test = s.global.pageLoaders[name];
    debugger;
    return s.global.pageLoaders[name];
  }, deepDifferent);
  // let pageScript = useStore(s => {
  //   // debugger;
  //   return s.global.pageLoaders;
  // }, deepDifferent)[name];
  const { pageIdPath } = React.useContext(pageCTX);
  // debugger;
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

  if (pageIdPath.includes(pageId)) {
    throw Error('Pages recursion');
  }

  return (
    <ComponentContainer {...containerProps} showBorders={showBorders}>
      <pageCTX.Provider
        value={{
          editMode: false,
          showControls: false,
          showBorders: false,
          isDragging: false,
          pageIdPath: [...pageIdPath, pageId],
          setIsDragging: () => {},
          handles: {},
          onDrop: () => {},
          onDelete: () => {},
          onEdit: () => {},
          onUpdate: () => {},
        }}
      >
        <PageLoader selectedPageId={pageId} />
      </pageCTX.Provider>
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
