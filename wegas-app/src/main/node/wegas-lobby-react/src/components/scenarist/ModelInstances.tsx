/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faCog, faMagic, faMinusCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import Select from 'react-select';
import { IGameModelWithId } from 'wegas-ts-api';
import { getGameModels, integrateScenario, releaseScenario } from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import { getDisplayName } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useAccount, useCurrentUser } from '../../selectors/userSelector';
import { useIntegratableScenarios, useModelInstances } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Button from '../common/Button';
import Card, { CardMainButton, cardSecButtonStyle } from '../common/Card';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import OpenCloseModal from '../common/OpenCloseModal';
import {
  cardDetailsStyle,
  cardSubDetailsStyle,
  cardTitleStyle,
  defaultSelectStyles,
  mainButtonStyle,
} from '../styling/style';
import GameModelSettings from './GameModelSettings';
import ShareGameModel from './ShareGameModel';

interface IntegratorProps {
  model: IGameModelWithId;
}

function Integrator({ model }: IntegratorProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUserId } = useCurrentUser();

  const [gameModelId, setGameModelId] = React.useState<number | null>(null);

  const gameModels = useIntegratableScenarios(currentUserId);

  const selectGameModelCb = React.useCallback((value: { value: number } | null) => {
    if (value != null) {
      setGameModelId(value.value);
    } else {
      setGameModelId(null);
    }
  }, []);

  const integrateCb = React.useCallback(() => {
    if (gameModelId != null) {
      dispatch(integrateScenario({ modelId: model.id, scenarioId: gameModelId }));
    }
  }, [model.id, gameModelId, dispatch]);

  const options = gameModels.gamemodels
    .map(gm => {
      return { value: gm.id, label: gm.name };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <h3>{i18n.integrateScenario}</h3>
      <Select options={options} onChange={selectGameModelCb}
            styles={defaultSelectStyles}
       />
      <Flex justify="flex-end">
        <Button className={mainButtonStyle} label={i18n.create} onClick={integrateCb} />
      </Flex>
    </>
  );
}

interface InstanceCardProps {
  gameModel: IGameModelWithId;
  closePanel: () => void;
}

function InstanceCard({ gameModel }: InstanceCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { isAdmin } = useCurrentUser();

  const releaseCb = React.useCallback(async () => {
    return dispatch(releaseScenario(gameModel.id));
  }, [gameModel.id, dispatch]);

  const createdByAccount = useAccount(gameModel.createdById);
  const createdBy = entityIs(createdByAccount, 'AbstractAccount', true) ? (
    getDisplayName(createdByAccount)
  ) : (
    <i>{i18n.anonymous}</i>
  );

  const gameModelName = gameModel.name ? `${i18n.GameModel} "${gameModel.name}"` : i18n.Game;

  return (
    <Card illustration={gameModel.properties.iconUri}>
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{gameModel.name}</div>
        <div className={cardDetailsStyle}>
          {`${i18n.createdOn} "${new Date(gameModel.createdTime).toLocaleDateString()}"`}
          {isAdmin ? (
            <>
              {' '}
              {i18n.by} {createdBy}
            </>
          ) : null}
        </div>
        <div className={cardSubDetailsStyle}>{gameModel.comments}</div>
      </FitSpace>

      <ActionIconButton
        shouldConfirm
        className={cardSecButtonStyle}
        icon={faMinusCircle}
        title={i18n.releaseScenario}
        onClick={releaseCb}
      />
      <OpenCloseModal
        icon={faCog}
        iconTitle={i18n.settings}
        title={gameModelName}
        illustration={gameModel.properties.iconUri}
        showCloseButton={true}
        route={`/${gameModel.id}/settings`}
      >
        {collapse => <GameModelSettings gameModel={gameModel} onClose={collapse} />}
      </OpenCloseModal>

      <OpenCloseModal
        icon={faUsers}
        iconTitle={i18n.viewTeam}
        title={gameModelName}
        illustration={gameModel.properties.iconUri}
        showCloseButton={true}
        route={`/${gameModel.id}/users`}
      >
        {() => <ShareGameModel gameModel={gameModel} />}
      </OpenCloseModal>

      <CardMainButton
        icon={faMagic}
        title={i18n.openGameModelAsScenarist}
        url={`../${gameModel.uiversion === 2 ? '2/' : ''}edit.html?gameModelId=${gameModel.id}`}
      />
    </Card>
  );
}

interface GameModelVersioningProps {
  gameModel: IGameModelWithId;
  closePanel: () => void;
}

export default function GameModelVersioning({
  closePanel,
  gameModel,
}: GameModelVersioningProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUserId } = useCurrentUser();

  const instances = useModelInstances(
    currentUserId,
    gameModel.id,
  );

  const scenarioStatus = instances.status['SCENARIO']['LIVE'];

  React.useEffect(() => {
    if (scenarioStatus === 'NOT_INITIALIZED') {
      dispatch(
        getGameModels({
          status: 'LIVE',
          type: 'SCENARIO',
        }),
      );
    }
  }, [scenarioStatus, dispatch]);

  return (
    <FitSpace direction="column" overflow="auto">
      <CardContainer>
        <Integrator model={gameModel} />
        <h4>{i18n.availableVersions}</h4>
        <FitSpace direction="column" overflow="auto">
          {scenarioStatus !== 'READY' ? (
            <InlineLoading />
          ) : (
            <>
              {instances.gamemodels.map(instance => (
                <InstanceCard key={instance.name} closePanel={closePanel} gameModel={instance} />
              ))}
            </>
          )}
        </FitSpace>
      </CardContainer>
    </FitSpace>
  );
}
