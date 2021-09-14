/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { IAaiAccountWithId } from 'wegas-ts-api';
import useTranslations from '../../i18n/I18nContext';
import FitSpace from '../common/FitSpace';

interface AaiAccountProps {
  account: IAaiAccountWithId;
}

export default function AaiAccount({ account }: AaiAccountProps): JSX.Element {
  const i18n = useTranslations();

  return (
    <FitSpace direction="column" overflow="auto">
      <h4>
        {i18n.editProfile} {account.id}
      </h4>
      {account.email}
      {account.homeOrg}
      {account.firstname}
      {account.lastname}
    </FitSpace>
  );
}
