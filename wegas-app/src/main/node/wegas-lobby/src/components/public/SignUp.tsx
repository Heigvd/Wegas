/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { css } from '@emotion/css';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../../API/api';
import { buildLinkWithQueryParam } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import Form, { Field, PasswordFeedback } from '../common/Form';
import { InlineLink } from '../common/Link';
import MelonContainer from '../common/MelonContainer';
import PolicyDisclaimer from './PolicyDisclaimer';

import PasswordErrorTooltip from '../common/password/PasswordErrorTooltip';

interface Props {
  redirectTo: string | null;
}

interface Data {
  username: string;
  email: string;
  password: string;
  strength: number;
  feedback?: PasswordFeedback;
  confirm: string;
  firstname: string;
  lastname: string;
  agreed: false;
}

const defData: Data = {
  username: '',
  email: '',
  password: '',
  strength: 0,
  confirm: '',
  firstname: '',
  lastname: '',
  agreed: false,
};

export default function SignUp(props: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const navigate = useNavigate();

  const fields: Field<Data>[] = [
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
      key: 'password',
      label: i18n.password,
      placeholder: i18n.password,
      type: 'password',
      isMandatory: false,
      isErroneous: data => data.strength < 2,
      errorMessage: (
        <div>
          {i18n.weakPassword}
        </div>
      ),
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
    {
      key: 'username',
      label: i18n.username,
      placeholder: i18n.username,
      type: 'text',
      isMandatory: false,
    },
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
      key: 'agreed',
      type: 'boolean',
      showAs: 'checkbox',
      isMandatory: true,
      label: (
        <span>
          {`${i18n.iAccept} `}
          <a target="_blank" rel="noreferrer" href={i18n.termOfUseUrl}>
            &nbsp;{i18n.termOfUse}
          </a>
          {` ${i18n.and} `}
          <a target="_blank" rel="noreferrer" href={i18n.dataPolicyUrl}>
            {i18n.dataPolicy}
          </a>
        </span>
      ),
      isErroneous: data => !data.agreed,
      errorMessage: i18n.notAgreed,
    },
  ];

  const createCb = React.useCallback(
    (credentials: Data) => {
      dispatch(signUp(credentials)).then(action => {
        // is that a hack or not ???
        if (props.redirectTo && action.meta.requestStatus === 'fulfilled') {
          navigate(props.redirectTo);
        }
      });
    },
    [dispatch, navigate, props.redirectTo],
  );

  return (
    <MelonContainer uberBelow={<PolicyDisclaimer />}>
      <Form fields={fields} value={defData} submitLabel={i18n.createAnAccount} onSubmit={createCb}>
        <InlineLink
          className={css({ alignSelf: 'flex-end' })}
          to={buildLinkWithQueryParam('/SignIn', { redirectTo: props.redirectTo })}
        >
          {i18n.cancel}
        </InlineLink>
      </Form>
    </MelonContainer>
  );
}
