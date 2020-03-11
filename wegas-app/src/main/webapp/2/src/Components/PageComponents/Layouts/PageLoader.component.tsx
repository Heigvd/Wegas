import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { PageDeserializer } from '../tools/PageDeserializer';
import { PageAPI } from '../../../API/pages.api';
import { GameModel } from '../../../data/selectors';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';

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
        <PageDeserializer json={pages[pageId]} uneditable />
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
