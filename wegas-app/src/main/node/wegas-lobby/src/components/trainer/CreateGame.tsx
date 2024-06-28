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
import { optionSelectMatch } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useInstantiableGameModels } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionButton from '../common/ActionButton';
import Button from '../common/Button';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import Input from '../common/Input';
import { defaultSelectStyles, mainButtonStyle } from '../styling/style';

interface CreateGameProps {
  close: () => void;
  callback: () => void;
}

export default function CreateGame({ close, callback }: CreateGameProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const gameModels = useInstantiableGameModels(currentUser != null ? currentUser.id : undefined);

  const [name, setName] = React.useState('');
  const [gameModelId, setGameModelId] = React.useState<number | null>(null);

  const onCreateCb = React.useCallback(async () => {
    if (gameModelId != null && name.length > 0) {
      return dispatch(
        createGame({
          templateId: gameModelId,
          name: name,
        }),
      ).then(a => {
        if (a.meta.requestStatus === 'fulfilled') {
          close();
        }
        callback();
      });
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

        <Select
          options={options}
          onChange={selectGameModelCb}
          placeholder={i18n.selectGame}
          styles={defaultSelectStyles}
          filterOption={optionSelectMatch}
        />

        <Flex justify="flex-end">
          <Button label={i18n.cancel} onClick={close} />
          <ActionButton
            className={mainButtonStyle}
            label={i18n.create}
            onClick={gameModelId != null && name.length > 0 ? onCreateCb : undefined}
          />
        </Flex>
      </FitSpace>
    );
  }
}
