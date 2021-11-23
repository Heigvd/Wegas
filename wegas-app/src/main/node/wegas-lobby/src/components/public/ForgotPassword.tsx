/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import * as React from 'react';
import { requestPasswordReset } from '../../API/api';
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
  email: string;
}

export default (props: Props): JSX.Element => {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const onSubmitCb = React.useCallback(
    (data: Data) => {
      dispatch(requestPasswordReset(data));
    },
    [dispatch],
  );

  const formFields: Field<Data>[] = [
    {
      key: 'email',
      placeholder: i18n.emailAddress,
      isErroneous: value => value.email.match('.*@.*') == null,
      errorMessage: i18n.emailAddressNotValid,
      type: 'text',
      isMandatory: false,
    },
  ];

  return (
    <MelonContainer below={<PolicyDisclaimer />}>
      <Form
        onSubmit={onSubmitCb}
        value={{ email: '' }}
        fields={formFields}
        submitLabel={i18n.sendMePassword}
      >
        <InlineLink
          className={css({ alignSelf: 'center' })}
          to={buildLinkWithQueryParam('/SignIn', { redirectTo: props.redirectTo })}
        >
          {i18n.cancel}
        </InlineLink>
      </Form>
    </MelonContainer>
  );
};
