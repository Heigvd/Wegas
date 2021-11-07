/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { IGuestJpaAccountWithId} from 'wegas-ts-api';
import useTranslations from '../../i18n/I18nContext';
import { useAppSelector} from '../../store/hooks';
import CardContainer from '../common/CardContainer';
import InlineLoading from '../common/InlineLoading';

interface GuestAccountProps {
  account: IGuestJpaAccountWithId;
  close: () => void;
}

export default function GuestAccount({account}: GuestAccountProps): JSX.Element {
  const i18n = useTranslations();
  const userId = account.parentId!;
  const user = useAppSelector(state => state.users.users[userId]);

  if (user === 'LOADING') {
    return <InlineLoading />;
  } else {
    return (
      <CardContainer>
        <div>
          {i18n.agreedTime}{' '}
          {account.agreedTime != null
            ? new Date(account.agreedTime).toLocaleDateString()
            : i18n.never}
        </div>
        <div>
          {i18n.lastSeenAt}{' '}
          {user.user.lastSeenAt
            ? new Date(user.user.lastSeenAt).toLocaleDateString()
            : i18n.never}
        </div>
      </CardContainer>
    );
  }
}
