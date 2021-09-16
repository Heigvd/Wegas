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
import { IGameModelWithId } from 'wegas-ts-api';
import { updateGameModel } from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import Button from '../common/Button';
import CardContainer from '../common/CardContainer';
import Checkbox from '../common/Checkbox';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import Form, { Field } from '../common/Form';
import IllustrationPicker from '../common/illustrations/IllustrationPicker';
import { modalSeparatorBorder } from '../common/Modal';
import Tabs, { Tab } from '../common/Tabs';
import { labelStyle, mainButtonStyle } from '../styling/style';

interface SettingsProps {
  gameModel: IGameModelWithId;
  onGameModelUpdate: (gameModel: IGameModelWithId) => void;
}

const indent = css({
  paddingTop: '15px',
  paddingBottom: '15px',
  paddingLeft: '15px',
});

function GameModelBasicSettings({ gameModel, onGameModelUpdate }: SettingsProps) {
  const i18n = useTranslations();

  const [individual, setIndividual] = React.useState(gameModel.properties.freeForAll);

  const toggleGameType = React.useCallback(() => {
    setIndividual(current => {
      const newValue = !current;
      onGameModelUpdate({
        ...gameModel,
        properties: { ...gameModel.properties, freeForAll: newValue },
      });
      return newValue;
    });
  }, [gameModel, onGameModelUpdate]);

  const form1: Field<IGameModelWithId>[] = [
    {
      type: 'text',
      key: 'name',
      label: i18n.name,
      placeholder: i18n.nameIsRequired,
      isErroneous: data => data.name.length === 0,
      isMandatory: true,
    },
  ];

  const form2: Field<IGameModelWithId>[] = [
    {
      type: 'textarea',
      key: 'comments',
      label: i18n.comments,
      placeholder: i18n.commentsAreOptional,
      isMandatory: false,
    },
  ];

  return (
    <CardContainer>
      <Form fields={form1} value={gameModel} autoSubmit={true} onSubmit={onGameModelUpdate}></Form>

      <div className={labelStyle}>{i18n.gameType}</div>
      <div className={indent}>
        <Checkbox label={i18n.individual} value={individual} onChange={toggleGameType} />
        <Checkbox label={i18n.inTeam} value={!individual} onChange={toggleGameType} />
      </div>
      <Form fields={form2} value={gameModel} autoSubmit={true} onSubmit={onGameModelUpdate}></Form>
    </CardContainer>
  );
}

function GameModelIconSettings({ gameModel, onGameModelUpdate }: SettingsProps) {
  const onIconChangeCb = React.useCallback(
    (icon: string) => {
      onGameModelUpdate({ ...gameModel, properties: { ...gameModel.properties, iconUri: icon } });
    },
    [onGameModelUpdate, gameModel],
  );

  return <IllustrationPicker value={gameModel.properties.iconUri} onChange={onIconChangeCb} />;
}

export function GameModelAdvancedSettingsForm({ gameModel, onGameModelUpdate }: SettingsProps) {
  const i18n = useTranslations();

  const onFormSubmit = React.useCallback(
    (data: IGameModelWithId['properties']) => {
      onGameModelUpdate({ ...gameModel, properties: data });
    },
    [gameModel, onGameModelUpdate],
  );

  const form1: Field<IGameModelWithId['properties']>[] = [
    {
      type: 'text',
      key: 'logID',
      label: i18n.logId,
      placeholder: i18n.logId,
      isMandatory: false,
    },
    {
      type: 'boolean',
      showAs: 'checkbox',
      key: 'guestAllowed',
      label: i18n.guestAllowed,
      isMandatory: false,
    },
    {
      type: 'text',
      key: 'scriptUri',
      label: i18n.serverScript,
      placeholder: i18n.serverScript,
      isMandatory: false,
    },
    {
      type: 'text',
      key: 'clientScriptUri',
      label: i18n.clientScript,
      placeholder: i18n.clientScript,
      isMandatory: false,
    },
    {
      type: 'text',
      key: 'pagesUri',
      label: i18n.pages,
      placeholder: i18n.pages,
      isMandatory: false,
    },
  ];

  return (
    <Form fields={form1} value={gameModel.properties} autoSubmit={true} onSubmit={onFormSubmit} />
  );
}

function GameModelAdvancedSettings({ gameModel, onGameModelUpdate }: SettingsProps) {
  const i18n = useTranslations();

  return (
    <CardContainer>
      <span className={css({ color: 'red' })}>
        <FontAwesomeIcon icon={faExclamationTriangle} /> {i18n.disclaimer}{' '}
      </span>
      <GameModelAdvancedSettingsForm gameModel={gameModel} onGameModelUpdate={onGameModelUpdate} />
    </CardContainer>
  );
}

interface GameModelSettingsProps {
  gameModel: IGameModelWithId;
  onClose: () => void;
}

export default function GameModelSettings({ gameModel, onClose }: GameModelSettingsProps) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [state, setState] = React.useState<{
    gameModel: IGameModelWithId;
  }>({
    gameModel: gameModel,
  });

  const updateGameModelCb = React.useCallback((gameModel: IGameModelWithId) => {
    setState(state => ({ ...state, gameModel: gameModel }));
  }, []);

  const [gameModelUnsaved, setGameModelUnsaved] = React.useState(false);

  React.useEffect(() => {
    if (state.gameModel && entityIs(gameModel, 'GameModel')) {
      const isDiff =
        state.gameModel.name != gameModel.name ||
        state.gameModel.comments != gameModel.comments ||
        state.gameModel.properties.freeForAll != gameModel.properties.freeForAll ||
        state.gameModel.properties.iconUri != gameModel.properties.iconUri ||
        state.gameModel.properties.logID != gameModel.properties.logID ||
        state.gameModel.properties.scriptUri != gameModel.properties.scriptUri ||
        state.gameModel.properties.clientScriptUri != gameModel.properties.clientScriptUri ||
        state.gameModel.properties.cssUri != gameModel.properties.cssUri ||
        state.gameModel.properties.pagesUri != gameModel.properties.pagesUri;

      setGameModelUnsaved(isDiff);
    }
  }, [state, dispatch, gameModel]);

  const saveCb = React.useCallback(() => {
    if (gameModelUnsaved) {
      dispatch(updateGameModel(state.gameModel));
    }
    onClose();
  }, [state, gameModelUnsaved, dispatch, onClose]);

  return (
    <FitSpace direction="column" overflow="auto">
      <FitSpace direction="column" overflow="auto">
        <Tabs>
          <Tab name="basic" label={i18n.basicSettings}>
            <GameModelBasicSettings gameModel={gameModel} onGameModelUpdate={updateGameModelCb} />
          </Tab>
          <Tab name="icon" label={i18n.iconSettings}>
            <GameModelIconSettings
              gameModel={state.gameModel}
              onGameModelUpdate={updateGameModelCb}
            />
          </Tab>
          <Tab name="advanced" label={i18n.advancedSettings}>
            <GameModelAdvancedSettings
              gameModel={gameModel}
              onGameModelUpdate={updateGameModelCb}
            />
          </Tab>
        </Tabs>
      </FitSpace>
      <Flex
        className={css({
          borderTop: modalSeparatorBorder,
        })}
        justify="space-between"
        align="center"
      >
        <div className={css({ margin: '10px', color: 'var(--warningColor)' })}>
          {gameModelUnsaved ? (
            <>
              <FontAwesomeIcon icon={faExclamationTriangle} /> {i18n.pendingChanges}{' '}
            </>
          ) : null}
        </div>
        <Button className={mainButtonStyle} label={i18n.save} onClick={saveCb} />
      </Flex>
    </FitSpace>
  );
}
