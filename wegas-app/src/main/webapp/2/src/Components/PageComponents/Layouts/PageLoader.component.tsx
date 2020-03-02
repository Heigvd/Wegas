import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';
import { PageLoader } from '../../../Editor/Components/Page/PageLoader';

interface PlayerPageLoaderProps extends PageComponentMandatoryProps {
  selectedPageId?: IScript;
}

function PlayerPageLoader({
  EditHandle,
  selectedPageId,
}: PlayerPageLoaderProps) {
  const pageId = useScript(
    selectedPageId ? selectedPageId.content : '',
  ) as string;
  return (
    <>
      <EditHandle />
      {selectedPageId === undefined ? (
        <pre>Unknown pageid</pre>
      ) : (
        <PageLoader selectedPageId={pageId} />
      )}
    </>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerPageLoader,
    'PageLoader',
    'windows',
    {
      selectedPageId: schemaProps.pageSelect('Page', false),
    },
    [],
    () => ({}),
  ),
);
