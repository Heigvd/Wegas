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
import { createGame, getGameModels } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useInstantiableGameModels } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import Button from '../common/Button';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import Input from '../common/Input';
import { mainButtonStyle } from '../styling/style';

interface CreateGameProps {
  close: () => void;
}

export default function CreateGame({ close }: CreateGameProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const gameModels = useInstantiableGameModels(currentUser != null ? currentUser.id : undefined);

  const [name, setName] = React.useState('');
  const [gameModelId, setGameModelId] = React.useState<number | null>(null);

  const onCreateCb = React.useCallback(() => {
    if (gameModelId != null) {
      dispatch(
        createGame({
          templateId: gameModelId,
          name: name,
        }),
      ).then(() => close());
    }
  }, [dispatch, gameModelId, name, close]);

  const selectGameModelCb = React.useCallback((value: { value: number } | null) => {
    if (value != null) {
      setGameModelId(value.value);
    } else {
      setGameModelId(null);
    }
  }, []);

  const mStatus = gameModels.status.MODEL.LIVE;
  const sStatus = gameModels.status.SCENARIO.LIVE;

  React.useEffect(() => {
    if (sStatus == 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: 'LIVE', type: 'SCENARIO' }));
    }

    if (mStatus == 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: 'LIVE', type: 'MODEL' }));
    }
  }, [sStatus, mStatus, dispatch]);

  if (mStatus != 'READY' || sStatus != 'READY') {
    return <InlineLoading />;
  } else {
    const options = gameModels.gamemodels
      .map(gm => {
        return { value: gm.id, label: gm.name };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <FitSpace direction="column">
        <h3>{i18n.createGame}</h3>
        <Input
          placeholder={i18n.gameName}
          className={css({ minWidth: '400px', paddingBottom: '20px' })}
          value={name}
          onChange={setName}
        />

        <Select options={options} onChange={selectGameModelCb} />

        <Flex justify="flex-end">
          <Button label={i18n.cancel} onClick={close} />
          <Button className={mainButtonStyle} label={i18n.create} onClick={onCreateCb} />
        </Flex>
      </FitSpace>
    );
  }
}
