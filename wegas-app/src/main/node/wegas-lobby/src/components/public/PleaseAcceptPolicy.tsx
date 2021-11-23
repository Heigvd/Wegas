/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import * as React from 'react';
import { signOut, updateAccount } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useAppDispatch } from '../../store/hooks';
import Button from '../common/Button';
import Flex from '../common/Flex';
import Loading from '../common/Loading';
import { mainButtonStyle } from '../styling/style';

export default function PleaseAcceptPolicy(): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();

  const { currentAccount } = useCurrentUser();

  const logoutCb = React.useCallback(() => {
    dispatch(signOut());
  }, [dispatch]);

  const updateAccountCb = React.useCallback(() => {
    if (currentAccount != null) {
      dispatch(updateAccount({ ...currentAccount, agreedTime: new Date().getTime() }));
    }
  }, [dispatch, currentAccount]);

  return (
    <Loading animated={false}>
      <div className={css({ padding: '10px' })}>
        <i>
          {`${i18n.agreementDisclaimer} `}
          <a target="_blank" rel="noreferrer" href={i18n.termOfUseUrl}>
            &nbsp;{i18n.termOfUse}
          </a>
          {` ${i18n.and} `}
          <a target="_blank" rel="noreferrer" href={i18n.dataPolicyUrl}>
            {i18n.dataPolicy}
          </a>
        </i>
      </div>
      <Flex justify="center">
        <Button label={i18n.cancel} onClick={logoutCb} />
        <Button className={mainButtonStyle} label={i18n.agree} onClick={updateAccountCb} />
      </Flex>
    </Loading>
  );
}
