/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IRoleWithId } from 'wegas-ts-api';
import { getRoleMembers } from '../../API/api';
import { useRoleMembers } from '../../selectors/userSelector';
import { useAppDispatch } from '../../store/hooks';
import InlineLoading from '../common/InlineLoading';

export interface RoleEmailsProps {
  role: IRoleWithId;
}

export default function RoleEmails({ role }: RoleEmailsProps) {
  const dispatch = useAppDispatch();
  const { status, accounts } = useRoleMembers(role.id);

  React.useEffect(() => {
    if (status === 'NOT_INITIALIZED') {
      dispatch(getRoleMembers(role.id));
    }
  }, [status, dispatch, role.id]);

  const emails = accounts.map(a => a.email);

  // each address in on bcc header make most client happy but outlook
  //const href = `mailto:?${emails.map(email => `bcc=${email}`).join('&')}`;

  // comma-separated list of bcc is spec-compliant but outlook does not undestand it
  //const href = `mailto:?bcc=${emails.join(';')}`;
  
  // semicolon separated list of bcc makes outlook and most other clients happy
  // let's use it
  const href = `mailto:?bcc=${emails.join(';')}`;

  return (
    <>
      {status === 'READY' ? (
        <a href={href}>
          <FontAwesomeIcon icon={faEnvelope} />{' '}
        </a>
      ) : (
        <InlineLoading />
      )}
    </>
  );
}
