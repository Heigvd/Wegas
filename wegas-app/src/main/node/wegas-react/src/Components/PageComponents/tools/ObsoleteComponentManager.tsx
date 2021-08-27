import * as React from 'react';
import { store } from '../../../data/Stores/store';
import {
  updateComponent,
  patchPage,
} from '../../../Editor/Components/Page/PageEditor';
import { wwarn } from '../../../Helper/wegaslog';
import { Button } from '../../Inputs/Buttons/Button';
import { getComponentFromPath } from './PageDeserializer';

export interface ObsoleteComponent {
  keepDisplayingToPlayer: boolean;
  isObsolete: (oldComponent: WegasComponent) => boolean;
  sanitizer: (oldComponent: WegasComponent) => WegasComponent;
}

export function displayObsoleteComponentManager(
  obsoleteComponent: ObsoleteComponent | undefined,
  wegasComponent: WegasComponent,
): obsoleteComponent is ObsoleteComponent {
  return (
    obsoleteComponent != null &&
    obsoleteComponent.isObsolete(wegasComponent) &&
    (!obsoleteComponent.keepDisplayingToPlayer || API_VIEW === 'Editor')
  );
}

interface ObsoleteComponentManagerProps {
  path: number[];
  pageId: string | undefined;
  componentType: string | undefined;
  sanitizer: (oldComponent: WegasComponent) => WegasComponent;
}

export function ObsoleteComponentManager({
  path,
  pageId,
  componentType,
  sanitizer,
}: ObsoleteComponentManagerProps) {
  return (
    <pre>
      This component is obsolete.{' '}
      {API_VIEW === 'Editor'
        ? 'Please click on the button below to update.'
        : 'Please contact your trainer.'}
      {API_VIEW === 'Editor' && (
        <Button
          label="Update component"
          onClick={() => {
            if (!pageId) {
              wwarn('Error in ' + componentType);
              return;
            }

            const page = store.getState().pages[pageId];
            if (!page) {
              wwarn('Error in ' + componentType);
              return;
            }

            const wegasComponent = getComponentFromPath(page, path);
            if (
              pageId == null ||
              page == null ||
              path == null ||
              wegasComponent == null
            ) {
              wwarn('Error in ' + componentType);
              return;
            }

            const newComponent = sanitizer(wegasComponent);

            const newPage = updateComponent(page, newComponent, path);
            if (newPage == null) {
              wwarn('Error in ' + componentType);
              return;
            }

            patchPage(pageId, newPage);
          }}
        />
      )}
    </pre>
  );
}
