/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { css } from '@emotion/css';
import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { signUp } from '../../API/api';
import { buildLinkWithQueryParam } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import Form, { Field } from '../common/Form';
import { InlineLink } from '../common/Link';
import MelonContainer from '../common/MelonContainer';
import PolicyDisclaimer from './PolicyDisclaimer';

interface Props {
  redirectTo: string | null;
}

interface Data {
  username: string;
  email: string;
  password: string;
  strength: number;
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

export default (props: Props): JSX.Element => {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const history = useHistory();

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
          {i18n.weakPassword} {i18n.passwordConditions.mustContain}
          <ul className={css({ margin: '3px 0' })}>
            <li>{i18n.passwordConditions.minChars}</li>
            <li>{i18n.passwordConditions.minCaps}</li>
            <li>{i18n.passwordConditions.minNums}</li>
          </ul>
        </div>
      ),
      showStrenghBar: false,
      strengthProp: 'strength',
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
    credentials => {
      dispatch(signUp(credentials)).then(action => {
        // is that a hack or not ???
        if (props.redirectTo && action.meta.requestStatus === 'fulfilled') {
          history.push(props.redirectTo);
        }
      });
    },
    [dispatch, history, props.redirectTo],
  );

  return (
    <MelonContainer below={<PolicyDisclaimer />}>
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
};
