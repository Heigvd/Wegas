/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import * as React from 'react';
import Select from 'react-select';
import { getGameModels, inferModel } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useIntegratableScenarios } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import Button from '../common/Button';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import Input from '../common/Input';
import { defaultSelectStyles, mainButtonStyle } from '../styling/style';

interface InferModelProps {
  close: () => void;
}

export default function InferModel({ close }: InferModelProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const gameModels = useIntegratableScenarios(currentUser != null ? currentUser.id : undefined);

  const [name, setName] = React.useState('');
  const [gameModelIds, setGameModelIds] = React.useState<number[]>([]);

  const onCreateCb = React.useCallback(() => {
    dispatch(
      inferModel({
        gmIds: gameModelIds,
        name: name,
      }),
    ).then(() => close());
  }, [dispatch, gameModelIds, name, close]);

  const selectGameModelCb = React.useCallback((values: Readonly<{ value: number }[]>) => {
    setGameModelIds(values.map(v => v.value));
  }, []);

  const sStatus = gameModels.status.SCENARIO.LIVE;

  React.useEffect(() => {
    if (sStatus === 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: 'LIVE', type: 'SCENARIO' }));
    }
  }, [sStatus, dispatch]);

  if (sStatus != 'READY') {
    return <InlineLoading />;
  } else {
    const options = gameModels.gamemodels
      .map(gm => {
        const name = gm.name;
        return { value: gm.id, label: name };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <FitSpace direction="column">
        <h3>{i18n.inferModel}</h3>
        <Input
          placeholder={i18n.modelName}
          className={css({ minWidth: '400px', paddingBottom: '20px' })}
          value={name}
          onChange={setName}
        />

        <Select
          isMulti
          closeMenuOnSelect={false}
          options={options}
          onChange={selectGameModelCb}
          styles={defaultSelectStyles}
        />

        <Flex justify="flex-end">
          <Button label={i18n.cancel} onClick={close} />
          <Button className={mainButtonStyle} label={i18n.create} onClick={onCreateCb} />
        </Flex>
      </FitSpace>
    );
  }
}
