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
import { createScenario, getGameModels } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useDuplicatableGameModels } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import Button from '../common/Button';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import Input from '../common/Input';
import { mainButtonStyle } from '../styling/style';

interface CreateScenarioProps {
  close: () => void;
}

export default function CreateScenario({ close }: CreateScenarioProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const gameModels = useDuplicatableGameModels(currentUser != null ? currentUser.id : undefined);

  const [name, setName] = React.useState('');
  const [gameModelId, setGameModelId] = React.useState<number | null>(null);

  const onCreateCb = React.useCallback(() => {
    if (gameModelId != null) {
      dispatch(
        createScenario({
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
        const name = gm.type === 'MODEL' ? `[${i18n.Model}] ${gm.name}` : gm.name;
        return { value: gm.id, label: name };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <FitSpace direction="column">
        <h3>{i18n.createGameModel}</h3>
        <Input
          placeholder={i18n.gameModelName}
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
