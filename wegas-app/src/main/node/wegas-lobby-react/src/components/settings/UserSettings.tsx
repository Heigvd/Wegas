/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { IAaiAccountWithId, IJpaAccountWithId } from 'wegas-ts-api';
import { getRestClient } from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import { IUserWithAccounts } from '../../API/restClient';
import InlineLoading from '../common/InlineLoading';
import AaiAccount from './AaiAccount';
import JpaAccount from './JpaAccount';

export function UserSettings({
  userId,
  close,
}: {
  userId: number;
  close: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<'UNSET' | 'LOADING' | IUserWithAccounts>('UNSET');

  React.useEffect(() => {
    const load = async () => {
      //hack: reload user with full details
      if (state === 'UNSET') {
        setState('LOADING');
        const user = await getRestClient().UserController.getFullUser(userId);
        setState(user);
      }
    };
    load();
  }, [state, userId]);

  if (state == 'UNSET' || state == 'LOADING') {
    return <InlineLoading />;
  } else {
    const account = state.accounts != null ? state.accounts[0] : undefined;

    if (entityIs(account, 'AaiAccount')) {
      return <AaiAccount account={account as IAaiAccountWithId} />;
    } else if (entityIs(account, 'JpaAccount')) {
      return <JpaAccount close={close} account={account as IJpaAccountWithId} />;
    }
    return <i>Not yet implemented</i>;
  }
}
