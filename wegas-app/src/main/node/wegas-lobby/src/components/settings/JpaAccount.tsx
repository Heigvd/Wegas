/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { IJpaAccountWithId } from 'wegas-ts-api';
import { getRestClient, updateAccount, updateJpaPassword } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';

import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import Form, { Field, PasswordFeedback } from '../common/Form';
import InlineLoading from '../common/InlineLoading';
import Tabs, { Tab } from '../common/Tabs';

import PasswordErrorTooltip from '../common/password/PasswordErrorTooltip';

interface JpaAccountProps {
  account: IJpaAccountWithId;
  close: () => void;
}

interface PasswordData {
  password: string;
  strength: number;
  confirm: string;
  feedback?: PasswordFeedback;
}

const defData: PasswordData = {
  password: '',
  strength: 0,
  confirm: '',
};

export function ChangePasswordJpaAccount({ account, close }: JpaAccountProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const fields: Field<PasswordData>[] = [
    {
      key: 'password',
      label: i18n.password,
      placeholder: i18n.password,
      type: 'password',
      isMandatory: true,
      isErroneous: data => data.strength < 2,
      errorMessage: i18n.weakPassword,
      showStrenghBar: true,
      strengthProp: 'strength',
      feedbackProp: 'feedback',
      dynamicErrorMessage: (feedback?: PasswordFeedback) => (
        <PasswordErrorTooltip
        warning={feedback?.warning}
        suggestions={feedback?.suggestions}
        ></PasswordErrorTooltip>)
    },
    {
      key: 'confirm',
      type: 'password',
      label: i18n.password_again,
      placeholder: i18n.password_again,
      isMandatory: true,
      isErroneous: data => data.password !== data.confirm,
      errorMessage: i18n.passwordsMismatch,
      showStrenghBar: false,
      dynamicErrorMessage: () => i18n.passwordsMismatch
    },
  ];

  const createCb = React.useCallback(
    (data: PasswordData) => {
      dispatch(
        updateJpaPassword({
          account: account,
          password: data.password,
        }),
      ).then(action => {
        if (action.meta.requestStatus === 'fulfilled') {
          close();
        }
      });
    },
    [dispatch, account, close],
  );

  return (
    <CardContainer>
      <Form fields={fields} value={defData} submitLabel={i18n.save} onSubmit={createCb} />
    </CardContainer>
  );
}

export function EditJpaAccount({ account, close }: JpaAccountProps): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const userId = account.parentId!;
  const user = useAppSelector(state => state.users.users[userId]);

  const { isAdmin } = useCurrentUser();

  const jpaFields: Field<IJpaAccountWithId>[] = [
    {
      key: 'firstname',
      label: i18n.firstname,
      placeholder: i18n.firstname,
      isErroneous: value => value.firstname.length === 0,
      errorMessage: i18n.missingFirstname,
      type: 'text',
      isMandatory: true,
    },
    {
      key: 'lastname',
      label: i18n.lastname,
      placeholder: i18n.lastname,
      isErroneous: value => value.lastname.length === 0,
      errorMessage: i18n.missingLastname,
      type: 'text',
      isMandatory: true,
    },
    {
      key: 'email',
      label: i18n.emailAddress,
      placeholder: i18n.emailAddress,
      isErroneous: value => value.email.match('.*@.*') == null,
      errorMessage: i18n.emailAddressNotValid,
      type: 'text',
      isMandatory: true,
    },
    {
      key: 'username',
      label: i18n.username,
      placeholder: i18n.username,
      type: 'text',
      isMandatory: false,
    },
  ];

  if (isAdmin) {
    jpaFields.push({
      key: 'comment',
      label: i18n.comments,
      placeholder: i18n.comments,
      type: 'textarea',
      isMandatory: false,
    });
  }

  const saveCb = React.useCallback(
    (account: IJpaAccountWithId) => {
      dispatch(updateAccount(account)).then(action => {
        if (action.meta.requestStatus === 'fulfilled') {
          close();
        }
      }); 
    }
  , [dispatch, close]);

  if (user === 'LOADING') {
    return <InlineLoading />;
  } else {
    return (
      <CardContainer>
        <Form
          fields={jpaFields}
          value={account}
          submitLabel={i18n.save}
          onSubmit={saveCb}
          autoSubmit={false}
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
          {!account.verified ? (
            <div>
              <ActionIconButton
                icon={faExclamationTriangle}
                title={i18n.verifyEmail}
                onClick={async () => {
                  return getRestClient().Authentication.requestEmailValidation();
                }}
              >
                {i18n.unverifiedEmail}
              </ActionIconButton>
            </div>
          ) : null}
        </Form>
        <Flex justify="space-between" align="center">
          <div className={css({ margin: '10px', color: 'var(--warningColor)' })}>
            
          </div>

        </Flex>
      </CardContainer>
    );
  }
}

export default function JpaAccount({ account, close }: JpaAccountProps): JSX.Element {
  const i18n = useTranslations();
  return (
    <FitSpace direction="column" overflow="auto">
      <Tabs>
        <Tab name="basic" label={i18n.editProfile}>
          <EditJpaAccount account={account} close={close} />
        </Tab>
        <Tab name="passwd" label={i18n.updatePassword}>
          <ChangePasswordJpaAccount account={account} close={close} />
        </Tab>
      </Tabs>
    </FitSpace>
  );
}

