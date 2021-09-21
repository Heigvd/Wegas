/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {css} from '@emotion/css';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import * as React from 'react';
import {IAaiAccountWithId} from 'wegas-ts-api';
import {updateAccount} from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import {useCurrentUser} from '../../selectors/userSelector';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import Button from '../common/Button';
import CardContainer from '../common/CardContainer';
import Flex from '../common/Flex';
import Form, {Field} from '../common/Form';
import InlineLoading from '../common/InlineLoading';
import {mainButtonStyle} from '../styling/style';

interface AaiAccountProps {
  account: IAaiAccountWithId;
  close: () => void;
}

export default function AaiAccount({account, close}: AaiAccountProps): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const userId = account.parentId!;
  const user = useAppSelector(state => state.users.users[userId]);

  const {isAdmin} = useCurrentUser();

  const aaiFields: Field<IAaiAccountWithId>[] = [
    {
      key: 'firstname',
      label: i18n.firstname,
      placeholder: i18n.firstname,
      isErroneous: value => value.firstname.length === 0,
      errorMessage: i18n.missingFirstname,
      type: 'text',
      readonly: true,
      isMandatory: false,
    },
    {
      key: 'lastname',
      label: i18n.lastname,
      placeholder: i18n.lastname,
      isErroneous: value => value.lastname.length === 0,
      errorMessage: i18n.missingLastname,
      type: 'text',
      readonly: true,
      isMandatory: false,
    },
    {
      key: 'email',
      label: i18n.emailAddress,
      placeholder: i18n.emailAddress,
      isErroneous: value => value.email.match('.*@.*') == null,
      errorMessage: i18n.emailAddressNotValid,
      type: 'text',
      readonly: true,
      isMandatory: false,
    },
    {
      key: 'homeOrg',
      label: i18n.aaiAffiliation,
      placeholder: i18n.aaiAffiliation,
      errorMessage: i18n.emailAddressNotValid,
      type: 'text',
      readonly: true,
      isMandatory: false,
    },
  ];


  if (isAdmin) {
    aaiFields.push({
      key: 'comment',
      label: i18n.comments,
      placeholder: i18n.comments,
      type: 'textarea',
      isMandatory: false,
    });
  }

  const [unsaved, setUnsaved] = React.useState(false);

  const [state, setState] = React.useState(account);

  React.useEffect(() => {
    const equals = state.comment === account.comment;
    setUnsaved(!equals);
  }, [state, dispatch, account]);

  const saveCb = React.useCallback(() => {
    if (unsaved) {
      dispatch(updateAccount(state)).then(action => {
        if (action.meta.requestStatus === 'fulfilled') {
          close();
        }
      });
    } else {
      close();
    }
  }, [unsaved, dispatch, state, close]);

  if (user === 'LOADING') {
    return <InlineLoading />;
  } else {
    return (
      <CardContainer>
        <Form
          fields={aaiFields}
          value={account}
          submitLabel={i18n.save}
          onSubmit={setState}
          autoSubmit={true}
        >
          {isAdmin ? (
            <>
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
            </>
          ) : undefined}
        </Form>
        {isAdmin  && false?
          <Flex align="center">
            <Flex grow={1} className={css({margin: '10px', color: 'var(--warningColor)'})}>
              {unsaved ? (
                <>
                  <FontAwesomeIcon icon={faExclamationTriangle} /> {i18n.pendingChanges}{' '}
                </>
              ) : null}
            </Flex>
            <Button label={i18n.cancel} onClick={close} />
            <Button className={mainButtonStyle} label={i18n.save} onClick={unsaved ? saveCb : undefined} />
          </Flex>
          : null}
      </CardContainer>
    );
  }
}
