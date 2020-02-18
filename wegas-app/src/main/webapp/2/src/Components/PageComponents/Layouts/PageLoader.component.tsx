import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { PageDeserializer } from '../tools/PageDeserializer';
import { PageAPI } from '../../../API/pages.api';
import { GameModel } from '../../../data/selectors';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';

const pages: Pages = {};
const gameModelId = GameModel.selectCurrent().id!;
PageAPI.getIndex(gameModelId).then(res => {
  res.forEach((index, _i) => {
    PageAPI.get(gameModelId, index.id, true).then(res => {
      pages[Object.keys(res)[0]] = Object.values(res)[0];
    });
  });
});

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
        <PageDeserializer json={pages[pageId]} uneditable />
      )}
    </>
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
