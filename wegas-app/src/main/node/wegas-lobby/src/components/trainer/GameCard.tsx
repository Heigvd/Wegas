/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import {
  faArchive,
  faCog,
  faKey,
  faLevelUpAlt,
  faTrash,
  faTrashRestore,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IGameModelWithId, IGameWithId } from 'wegas-ts-api';
import { changeGameStatus, finalDeleteGame, getUser, updateGame } from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import { getDisplayName } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useAccount, useCurrentUser } from '../../selectors/userSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card, { CardMainWifButton, cardSecButtonStyle } from '../common/Card';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import OnBlurInput from '../common/OnBlurInput';
import OpenCloseModal from '../common/OpenCloseModal';
import StatusIcon from '../common/StatusIcon';
import Toggler from '../common/Toggler';
import { cardDetailsStyle, cardSubDetailsStyle, cardTitleStyle } from '../styling/style';
import GameSettings from './GameSettings';
import { GameUsers } from './GameUsers';

const verySmallInput = css({
  '& input': {
    width: '130px',
    padding: '0 12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

const invisibleVerySmallInput = cx(
  verySmallInput,
  css({
    '& input': {
      visibility: 'hidden',
      transition: '0s',
    },
  }),
);

function EditKey({ game }: { game: IGameWithId }) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  // const [open, setOpen] = React.useState(game.access === 'OPEN');
  const open = game.access === 'OPEN';

  const updateCb = React.useCallback(
    (value: string) => {
      dispatch(updateGame({ ...game, token: value }));
    },
    [dispatch, game],
  );

  return (
    <Flex direction="row" align="center">
      <Toggler
        title={open ? i18n.gameIsOpen : i18n.gameIsClosed}
        value={open}
        onChange={() => {
          //setOpen(!open);
          dispatch(updateGame({ ...game, access: open ? 'CLOSE' : 'OPEN' }));
        }}
      />
      <FontAwesomeIcon className={css({ paddingRight: '5px' })} icon={faKey} />
      <OnBlurInput
        className={open ? verySmallInput : invisibleVerySmallInput}
        value={game.token}
        size="SMALL"
        onChange={updateCb}
      />
    </Flex>
  );
}

interface GameCardProps {
  game: IGameWithId;
  gameModel: IGameModelWithId;
}

export default function GameCard({ game, gameModel }: GameCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { isAdmin } = useCurrentUser();

  const archiveCb = React.useCallback(async () => {
    return dispatch(changeGameStatus({ gameId: game.id, status: 'BIN' }));
  }, [dispatch, game.id]);

  const restoreCb = React.useCallback(async () => {
    return dispatch(changeGameStatus({ gameId: game.id, status: 'LIVE' }));
  }, [dispatch, game.id]);

  const deleteCb = React.useCallback(async () => {
    return dispatch(changeGameStatus({ gameId: game.id, status: 'DELETE' }));
  }, [dispatch, game.id]);

  const finalDeleteCb = React.useCallback(async () => {
    return dispatch(finalDeleteGame(game.id));
  }, [dispatch, game.id]);

  // React.useEffect(() => {
  //  if (gameModel == null && gameModelId != null) {
  //   // Load gameModel !
  //   dispatch(getGameModelById(gameModelId));
  //  }
  // }, [gameModel, gameModelId, dispatch]);

  const createdByAccount = useAccount(game.createdById);
  const createdBy = entityIs(createdByAccount, 'AbstractAccount', true) ? (
    getDisplayName(createdByAccount)
  ) : (
    <i>{i18n.anonymous}</i>
  );

  React.useEffect(() => {
    if (isAdmin && game.createdById != null && createdByAccount === null) {
      dispatch(getUser(game.createdById));
    }
  }, [isAdmin, createdByAccount, dispatch, game.createdById]);

  const gameName = game.name ? `${i18n.Game} "${game.name}"` : i18n.Game;
  return (
    <Card illustration={gameModel.properties.iconUri}>
      <FitSpace direction="column" className={css({ flexBasis: '10px' })}>
        <div className={cardTitleStyle}>{game.name}</div>
        <div className={cardDetailsStyle}>
          {`${i18n.createdOn} "${new Date(game.createdTime).toLocaleDateString()}"`}
          {isAdmin ? (
            <>
              {' '}
              {i18n.by} {createdBy}
            </>
          ) : null}
        </div>
        <div className={cardDetailsStyle}>{`${i18n.basedOnScenario} "${gameModel.name}"`}</div>
        <div className={cardSubDetailsStyle}>{gameModel.comments}</div>
      </FitSpace>

      <StatusIcon status={game.status} />

      <EditKey game={game} />

      <FitSpace direction="column"> </FitSpace>

      <OpenCloseModal
        icon={faCog}
        iconTitle={i18n.settings}
        title={gameName}
        illustration={gameModel.properties.iconUri}
        showCloseButton={true}
        route={`/${gameModel.id}/settings`}
      >
        {collapse => <GameSettings game={game} onClose={collapse} />}
      </OpenCloseModal>

      <OpenCloseModal
        icon={faUsers}
        iconTitle={i18n.viewTeam}
        title={gameName}
        illustration={gameModel.properties.iconUri}
        showCloseButton={true}
        route={`/${gameModel.id}/users`}
      >
        {() => <GameUsers game={game} />}
      </OpenCloseModal>

      {game.status === 'LIVE' ? (
        <ActionIconButton
          shouldConfirm="SOFT_CENTER"
          className={cardSecButtonStyle}
          icon={faArchive}
          title={i18n.archive}
          onClick={archiveCb}
        />
      ) : null}

      {game.status === 'BIN' ? (
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

      {game.status === 'DELETE' ? (
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

      <CardMainWifButton
        icon="trainer"
        title={i18n.openGameAsTrainer}
        url={`./${gameModel.uiversion === 2 ? '2/' : ''}host.html?gameId=${game.id}`}
      />
    </Card>
  );
}
