/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {
  faArchive,
  faCodeBranch,
  faCog,
  faCopy,
  faCubes,
  faLanguage,
  faLevelUpAlt,
  faMagic,
  faPlug,
  faTrash,
  faTrashRestore,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { IGameModelWithId } from 'wegas-ts-api';
import { changeGameModelStatus, duplicateGameModel, finalDeleteGameModel } from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import { getDisplayName } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useAccount, useCurrentUser } from '../../selectors/userSelector';
import { useGameModelPermission } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card, { CardMainButton, cardSecButtonStyle } from '../common/Card';
import FitSpace from '../common/FitSpace';
import OpenCloseModal from '../common/OpenCloseModal';
import StatusIcon from '../common/StatusIcon';
import { cardDetailsStyle, cardSubDetailsStyle, cardTitleStyle } from '../styling/style';
import GameModelSettings from './GameModelSettings';
import GameModelVersioning from './GameModelVersioning';
import ModelInstances from './ModelInstances';
import ShareGameModel from './ShareGameModel';

interface GameModelCardProps {
  gameModel: IGameModelWithId;
}

export default function GameModelCard({ gameModel }: GameModelCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const gameModelId = gameModel.id;
  const { currentUserId, isAdmin } = useCurrentUser();

  const permission = useGameModelPermission(gameModelId, currentUserId);

  const duplicateCb = React.useCallback(async () => {
    return dispatch(duplicateGameModel(gameModelId));
  }, [dispatch, gameModelId]);

  const archiveCb = React.useCallback(async () => {
    return dispatch(changeGameModelStatus({ gameModelId: gameModelId, status: 'BIN' }));
  }, [dispatch, gameModelId]);

  const restoreCb = React.useCallback(async () => {
    return dispatch(changeGameModelStatus({ gameModelId: gameModelId, status: 'LIVE' }));
  }, [dispatch, gameModelId]);

  const deleteCb = React.useCallback(async () => {
    return dispatch(changeGameModelStatus({ gameModelId: gameModelId, status: 'DELETE' }));
  }, [dispatch, gameModelId]);

  const finalDeleteCb = React.useCallback(async () => {
    return dispatch(finalDeleteGameModel(gameModelId));
  }, [dispatch, gameModelId]);

  const createdByAccount = useAccount(gameModel.createdById);
  const createdBy = entityIs(createdByAccount, 'AbstractAccount', true) ? (
    getDisplayName(createdByAccount)
  ) : (
    <i>{i18n.anonymous}</i>
  );

  //  React.useEffect(() => {
  //    if (isAdmin && gameModel.createdById != null && createdByAccount === undefined) {
  //      dispatch(getUser(gameModel.createdById));
  //    }
  //  }, [isAdmin, createdByAccount, dispatch])
  //

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
        {gameModel.basedOnId != null ? (
          <div className={cardDetailsStyle}>{`${i18n.Model} "${gameModel.name}"`}</div>
        ) : null}
        <div className={cardSubDetailsStyle}>{gameModel.comments}</div>
      </FitSpace>

      <StatusIcon status={gameModel.status} />

      {permission === 'Edit' ? (
        <>
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

          <ActionIconButton
            className={cardSecButtonStyle}
            icon={faCopy}
            title={i18n.duplicate}
            onClick={duplicateCb}
          />

          <OpenCloseModal
            icon={faCodeBranch}
            iconTitle={i18n.versions}
            title={gameModelName}
            illustration={gameModel.properties.iconUri}
            showCloseButton={true}
            route={`/${gameModel.id}/versions`}
          >
            {close => <GameModelVersioning gameModel={gameModel} closePanel={close} />}
          </OpenCloseModal>

          {gameModel.type === 'MODEL' ? (
            <OpenCloseModal
              icon={faPlug}
              iconTitle={i18n.ModelInstances}
              title={gameModelName}
              illustration={gameModel.properties.iconUri}
              showCloseButton={true}
              route={`/${gameModel.id}/instances`}
            >
              {close => <ModelInstances gameModel={gameModel} closePanel={close} />}
            </OpenCloseModal>
          ) : null}

          {gameModel.status === 'LIVE' ? (
            <ActionIconButton
              className={cardSecButtonStyle}
              icon={faArchive}
              title={i18n.archive}
              onClick={archiveCb}
              shouldConfirm="SOFT_CENTER"
            />
          ) : null}

          {gameModel.status === 'BIN' ? (
            <>
              <ActionIconButton
                className={cardSecButtonStyle}
                icon={faLevelUpAlt}
                flip="horizontal"
                title={i18n.restore}
                onClick={restoreCb}
              />
              <ActionIconButton
                className={cardSecButtonStyle}
                shouldConfirm="HARD"
                icon={faTrash}
                title={i18n.moveToTrash}
                onClick={deleteCb}
              />
            </>
          ) : null}

          {gameModel.status === 'DELETE' ? (
            <>
              <ActionIconButton
                className={cardSecButtonStyle}
                icon={faTrashRestore}
                title={i18n.restore}
                onClick={archiveCb}
              />
              <ActionIconButton
                className={cardSecButtonStyle}
                shouldConfirm="HARD"
                icon={faTrash}
                title={i18n.finalDelete}
                onClick={finalDeleteCb}
              />
            </>
          ) : null}

          <CardMainButton
            icon={gameModel.type === 'SCENARIO' ? faMagic : faCubes}
            title={i18n.openGameModelAsScenarist}
            url={`./${gameModel.uiversion === 2 ? '2/' : ''}edit.html?gameModelId=${gameModel.id}`}
          />
        </>
      ) : null}

      {permission === 'Translate' ? (
        <CardMainButton
          icon={faLanguage}
          title={i18n.translate}
          url={`./${gameModel.uiversion === 2 ? '2/' : ''}translate.html?gameModelId=${
            gameModel.id
          }`}
        />
      ) : null}
    </Card>
  );
}
