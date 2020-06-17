import * as React from 'react';
import {
  WegasComponentOptionsActions,
  WegasComponentActionsProperties,
  WegasComponentOptionsAction,
  wegasComponentActions,
  WegasComponentActions,
} from './options';
import { useStore } from '../../../data/store';
import { omit } from 'lodash-es';

export interface ActionsState {
  locked?: boolean;
  onClick?: () => void;
}

interface ComponentActionsManagerProps {
  actions: WegasComponentOptionsActions & WegasComponentActionsProperties;
  setActionsState: (newState: ActionsState) => void;
}

export function ComponentActionsManager({
  actions,
  setActionsState,
}: ComponentActionsManagerProps) {
  const locked = useStore(
    s => actions.lock != null && s.global.locks[actions.lock] === true,
  );

  const onClick = React.useCallback(() => {
    if (
      !actions.confirmClick ||
      // TODO : Find a better way to do that than a modal!!!
      // eslint-disable-next-line no-alert
      confirm(actions.confirmClick)
    ) {
      Object.entries(
        omit(actions, 'confirmClick', 'lock') as WegasComponentOptionsActions,
      )
        .sort(
          (
            [, v1]: [string, WegasComponentOptionsAction],
            [, v2]: [string, WegasComponentOptionsAction],
          ) =>
            (v1.priority ? v1.priority : 0) - (v2.priority ? v2.priority : 0),
        )
        .forEach(([k, v]) =>
          wegasComponentActions[k as keyof WegasComponentActions](v),
        );
    }
  }, [actions]);

  React.useEffect(() => {
    setActionsState({ locked, onClick });
  }, [setActionsState, locked, onClick]);

  return null;
}
