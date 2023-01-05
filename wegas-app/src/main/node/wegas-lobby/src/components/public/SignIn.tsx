/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAaiConfig, signInWithJpaAccount } from '../../API/api';
import { buildLinkWithQueryParam } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import AAILogo from '../../images/aai.svg';
import EduIDLogo from '../../images/eduID.svg';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import Flex from '../common/Flex';
import Form, { Field } from '../common/Form';
import { InlineLink } from '../common/Link';
import MelonContainer from '../common/MelonContainer';
import PolicyDisclaimer from './PolicyDisclaimer';

interface Props {
  redirectTo: string | null;
  username: string | null;
}

interface Credentials {
  identifier: string;
  password: string;
}

const defCred: Credentials = {
  identifier: '',
  password: '',
};

const aaiStyle = css({
  height: '24px',
  paddingRight: '5px',
});

const eduIDStyle = css({
  height: '24px',
});

const aaiLinkStyle = css({
  alignSelf: 'center',
  display: 'flex',
  alignItems: 'center',
  margin: '10px',
  padding: '5px',
});

export default function SignInForm({ username, redirectTo }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const navigate = useNavigate();
  const signWithUsernameOnly = username != null && username.length > 0;

  const aaiConfig = useAppSelector(state => state.auth.aaiConfig);

  const showAaiButton = typeof aaiConfig === 'object' && aaiConfig.enabled && aaiConfig.showButton;
  const aaiUrl = typeof aaiConfig === 'object' ? aaiConfig.loginUrl : '';

  const showEduIdButton =
    typeof aaiConfig === 'object' && aaiConfig.eduIdEnabled && aaiConfig.eduIdUrl.length > 0;
  const eduIdUrl = typeof aaiConfig === 'object' ? aaiConfig.eduIdUrl : '';

  React.useEffect(() => {
    if (aaiConfig === 'UNKNOWN') {
      dispatch(getAaiConfig());
    }
  }, [aaiConfig, dispatch]);

  const formFields: Field<Credentials>[] = [
    {
      key: 'identifier',
      placeholder: i18n.emailOrUsername,
      isErroneous: data => data.identifier.length === 0,
      errorMessage: i18n.pleaseEnterId,
      type: 'text',
      isMandatory: false,
      readonly: signWithUsernameOnly,
    },
    {
      key: 'password',
      placeholder: i18n.password,
      type: 'password',
      isMandatory: false,
      showStrenghBar: false,
      fieldFooter: (
        <InlineLink
          className={css({ alignSelf: 'flex-start' })}
          to={buildLinkWithQueryParam('/ForgotPassword', { redirectTo: redirectTo })}
        >
          {i18n.forgottenPassword}
        </InlineLink>
      ),
    },
  ];

  const onSubmitCb = React.useCallback(
    (credentials: Credentials) => {
      dispatch(signInWithJpaAccount(credentials)).then(action => {
        // is that a hack or not ???
        if (redirectTo && action.meta.requestStatus === 'fulfilled') {
          navigate(redirectTo);
        }
      });
    },
    [dispatch, redirectTo, navigate],
  );

  return (
    <>
      <MelonContainer
        below={
          <Flex justify="space-evenly">
            {showAaiButton ? (
              <a className={aaiLinkStyle} href={aaiUrl} rel="noreferer">
                <AAILogo className={aaiStyle} />
                AAI Login
              </a>
            ) : null}
            {showEduIdButton ? (
              <a className={aaiLinkStyle} href={eduIdUrl} rel="noreferer">
                <EduIDLogo className={eduIDStyle} />
              </a>
            ) : null}
          </Flex>
        }
        uberBelow={<PolicyDisclaimer />}
      >
        <Form
          value={{ ...defCred, identifier: username || '' }}
          onSubmit={onSubmitCb}
          fields={formFields}
          submitLabel={i18n.login}
        >
          <InlineLink
            className={css({ alignSelf: 'center' })}
            to={buildLinkWithQueryParam('/SignUp', { redirectTo: redirectTo })}
          >
            {!signWithUsernameOnly ? (
              <>
                <FontAwesomeIcon icon={faPlusCircle} /> {i18n.createAnAccount}{' '}
              </>
            ) : null}
          </InlineLink>
        </Form>
      </MelonContainer>
    </>
  );
}
