import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';
import { PageIdLoader } from '../../../Editor/Components/Page/PageLoader';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';

interface PlayerPageLoaderProps extends PageComponentMandatoryProps {
  selectedPageId?: IScript;
}

function PlayerPageLoader(props: PlayerPageLoaderProps) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  const { selectedPageId } = childProps;
  const pageId = useScript(
    childProps.selectedPageId ? childProps.selectedPageId.content : '',
  ) as string;
  return (
    <ComponentContainer flexProps={flexProps}>
      {selectedPageId === undefined ? (
        <pre>Unknown pageid</pre>
      ) : (
        <PageIdLoader selectedPageId={pageId} />
      )}
    </ComponentContainer>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerPageLoader,
    'PageLoader',
    'window-maximize',
    {
      selectedPageId: schemaProps.pageSelect('Page', false),
    },
    [],
    () => ({}),
  ),
);
