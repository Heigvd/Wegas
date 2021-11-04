/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IRoleWithId } from 'wegas-ts-api';
import { updateRole } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import ActionButton from '../common/ActionButton';
import Button from '../common/Button';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import Form, { Field } from '../common/Form';
import { mainButtonStyle } from '../styling/style';

export interface SettingsProps {
  role: IRoleWithId;
  onClose: () => void;
}

export default function RoleSettings({ role, onClose }: SettingsProps) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [data, setData] = React.useState<IRoleWithId>(role);

  const saveCb = React.useCallback(async () => {
    if (data.name != role.name) {
      const p = dispatch(updateRole(data));
      p.then(onClose);
      return p;
    }
  }, [dispatch, data, role.name, onClose]);

  const roleFields: Field<IRoleWithId>[] = [
    {
      type: 'text',
      key: 'name',
      label: i18n.name,
      placeholder: i18n.nameIsRequired,
      isErroneous: data => data.name.length === 0,
      isMandatory: true,
    },
  ];

  return (
    <FitSpace direction="column" overflow="auto">
      <CardContainer>
        <Form fields={roleFields} value={role} autoSubmit={true} onSubmit={setData} />
      </CardContainer>
      <Flex justify="space-between" align="center">
        <div className={css({ flexGrow: 1, margin: '10px', color: 'var(--warningColor)' })}>
          {role.name != data.name ? (
            <>
              <FontAwesomeIcon icon={faExclamationTriangle} /> {i18n.pendingChanges}{' '}
            </>
          ) : null}
        </div>
        <Button label={i18n.cancel} onClick={onClose} />
        <ActionButton className={mainButtonStyle} label={i18n.save} onClick={saveCb} />
      </Flex>
    </FitSpace>
  );
}
