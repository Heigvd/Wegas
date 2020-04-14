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

type PlayerPageLoaderProps = PageComponentMandatoryProps &
  PageLoaderComponentProps;

function PlayerPageLoader(props: PlayerPageLoaderProps) {
  const {
    ComponentContainer,
    childProps,
    containerProps,
    showBorders,
  } = extractProps(props);
  const { selectedPageId } = childProps;
  const pageId = useScript(
    selectedPageId ? selectedPageId.content : '',
  ) as string;
  return (
    <ComponentContainer {...containerProps} showBorders={showBorders}>
      <pageCTX.Provider
        value={{
          editMode: false,
          showControls: false,
          showBorders: false,
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
    () => ({ name: 'Unamed' }),
  ),
);
