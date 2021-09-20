/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faClipboard, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QRCode from 'qrcode.react';
import * as React from 'react';
import { IGameModelLanguageWithId, IGameModelWithId, IGameWithId } from 'wegas-ts-api';
import { getGameModelById, updateGame, updateGameModel, updateLanguages } from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import { useGameModel } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Button from '../common/Button';
import CardContainer from '../common/CardContainer';
import Checkbox from '../common/Checkbox';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import Form, { Field } from '../common/Form';
import InlineLoading from '../common/InlineLoading';
import Tabs, { Tab } from '../common/Tabs';
import { GameModelAdvancedSettingsForm } from '../scenarist/GameModelSettings';
import { labelStyle, mainButtonStyle } from '../styling/style';

interface SettingsProps {
  game: IGameWithId;
  gameModel: IGameModelWithId;
  onGameUpdate: (game: IGameWithId) => void;
  onGameModelUpdate: (gameModel: IGameModelWithId) => void;
}

function GameBasicSettings({ game, gameModel, onGameUpdate, onGameModelUpdate }: SettingsProps) {
  const i18n = useTranslations();

  const gameFields: Field<IGameWithId>[] = [
    {
      type: 'text',
      key: 'name',
      label: i18n.name,
      placeholder: i18n.nameIsRequired,
      isErroneous: data => data.name.length === 0,
      isMandatory: true,
    },
    {
      type: 'text',
      key: 'token',
      label: i18n.accessKey,
      placeholder: i18n.accessKeyIsRequiered,
      isErroneous: data => data.token.length === 0,
      isMandatory: true,
    },
  ];

  const gameModelFields: Field<IGameModelWithId>[] = [
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
      <Form fields={gameFields} value={game} autoSubmit={true} onSubmit={onGameUpdate}>
        {' '}
      </Form>
      <Form
        fields={gameModelFields}
        value={gameModel}
        autoSubmit={true}
        onSubmit={onGameModelUpdate}
      >
        {' '}
      </Form>
    </CardContainer>
  );
}

const indent = css({
  paddingTop: '15px',
  paddingBottom: '15px',
  paddingLeft: '15px',
});

function GameAdvancedSettings({ game, gameModel, onGameModelUpdate }: SettingsProps) {
  const i18n = useTranslations();
  const { isAdmin } = useCurrentUser();

  const [qrSmall, setQrSmale] = React.useState(true);

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

  const playUrl = `${window.location.toString().replace(window.location.hash, '')}#/play/${
    game.token
  }`;

  return (
    <CardContainer>
      <div className={labelStyle}>
        {gameModel.properties.guestAllowed ? i18n.gameLinkTitleAsGuest : i18n.gameLinkTitle}
      </div>
      <div className={indent}>
        {gameModel.properties.guestAllowed ? i18n.gameLinkGuest : i18n.gameLink}
      </div>
      <Flex className={indent} align="center" overflow="auto" shrink={0}>
        <QRCode
          className={css({
            cursor: qrSmall ? 'zoom-in' : 'zoom-out',
          })}
          onClick={() => setQrSmale(small => !small)}
          value={playUrl}
          size={qrSmall ? 32 : 256}
          includeMargin={true}
          renderAs={'canvas'}
        />
        <div>{playUrl}</div>
        <ActionIconButton
          title={i18n.copyToClipboard}
          confirmMessage={i18n.copiedToClipboard}
          icon={faClipboard}
          onClick={async () => {
            navigator.clipboard.writeText(playUrl);
          }}
        />
      </Flex>

      <div className={labelStyle}>{i18n.gameType}</div>
      <div className={indent}>
        <Checkbox label={i18n.individual} value={individual} onChange={toggleGameType} />
        <Checkbox label={i18n.inTeam} value={!individual} onChange={toggleGameType} />
      </div>

      {isAdmin ? (
        <>
          <div className={labelStyle}>{i18n.adminLevelSettins}</div>
          <div className={indent}>
            <GameModelAdvancedSettingsForm
              gameModel={gameModel}
              onGameModelUpdate={onGameModelUpdate}
            />
          </div>
        </>
      ) : null}
    </CardContainer>
  );
}

interface LangSettingsProps {
  gameModel: IGameModelWithId;
  onLangUpdate: (code: string, active: boolean) => void;
}

function GameLanguageSettings({ gameModel, onLangUpdate }: LangSettingsProps) {
  const i18n = useTranslations();

  const [langs, setLangs] = React.useState(
    gameModel.languages.reduce<Record<string, boolean>>((acc, cur) => {
      acc[cur.code] = cur.active;
      return acc;
    }, {}),
  );

  const toggleLanguage = React.useCallback(
    (code: string) => {
      setLangs(currents => {
        const newValue = !currents[code];
        onLangUpdate(code, newValue);
        return { ...currents, [code]: newValue };
      });
    },
    [onLangUpdate],
  );

  return (
    <CardContainer>
      <div className={labelStyle}>{i18n.langSettings}</div>
      <div className={indent}>
        {gameModel.languages.map(lang => (
          <Checkbox
            key={lang.code}
            label={lang.lang}
            value={langs[lang.code]}
            onChange={() => toggleLanguage(lang.code)}
          />
        ))}
      </div>
    </CardContainer>
  );
}

interface GameSettingsProps {
  game: IGameWithId;
  onClose: () => void;
}

export default function GameSettings({ game, onClose }: GameSettingsProps) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const gameModel = useGameModel(game.parentId);

  const [state, setState] = React.useState<{
    game: IGameWithId;
    gameModel: IGameModelWithId | undefined;
    langs: Record<string, boolean>;
  }>({
    game: game,
    gameModel: entityIs(gameModel, 'GameModel') ? gameModel : undefined,
    langs: {},
  });

  React.useEffect(() => {
    if (gameModel == undefined && game.parentId) {
      dispatch(getGameModelById({ id: game.parentId, view: 'Lobby' }));
    }
  }, [gameModel, game.parentId, dispatch]);

  const updateGameCb = React.useCallback((game: IGameWithId) => {
    setState(state => ({ ...state, game: game }));
  }, []);

  const updateGameModelCb = React.useCallback((gameModel: IGameModelWithId) => {
    setState(state => ({ ...state, gameModel: gameModel }));
  }, []);

  const updateLangCb = React.useCallback((code: string, active: boolean) => {
    setState(state => ({ ...state, langs: { ...state.langs, [code]: active } }));
  }, []);

  const [gameUnsaved, setGameUnsaved] = React.useState(false);
  const [gameModelUnsaved, setGameModelUnsaved] = React.useState(false);
  const [langsUnsaved, setLangsUnsaved] = React.useState(false);

  React.useEffect(() => {
    setGameUnsaved(state.game.name !== game.name || state.game.token !== game.token);
  }, [state, dispatch, game.name, game.token]);

  React.useEffect(() => {
    if (state.gameModel && entityIs(gameModel, 'GameModel')) {
      setGameModelUnsaved(
        state.gameModel.comments !== gameModel.comments ||
          state.gameModel.properties.freeForAll !== gameModel.properties.freeForAll ||
          state.gameModel.properties.freeForAll !== gameModel.properties.freeForAll ||
          state.gameModel.properties.pagesUri !== gameModel.properties.pagesUri ||
          state.gameModel.properties.scriptUri !== gameModel.properties.scriptUri ||
          state.gameModel.properties.cssUri !== gameModel.properties.cssUri ||
          state.gameModel.properties.guestAllowed !== gameModel.properties.guestAllowed ||
          state.gameModel.properties.clientScriptUri !== gameModel.properties.clientScriptUri ||
          state.gameModel.properties.logID !== gameModel.properties.logID ||
          state.gameModel.properties.iconUri !== gameModel.properties.iconUri,
      );
    }
  }, [state, dispatch, gameModel]);

  React.useEffect(() => {
    if (state.gameModel && entityIs(gameModel, 'GameModel')) {
      const result =
        gameModel.languages.find(gmLang => {
          const s = state.langs[gmLang.code];
          return s !== undefined && s !== gmLang.active;
        }) != null;
      setLangsUnsaved(result);
    }
  }, [state, dispatch, gameModel]);

  const saveCb = React.useCallback(() => {
    if (gameUnsaved) {
      dispatch(updateGame(state.game));
    }

    if (gameModelUnsaved && state.gameModel != null) {
      dispatch(updateGameModel(state.gameModel));
    }

    if (langsUnsaved && entityIs(gameModel, 'GameModel')) {
      const toUpdate: IGameModelLanguageWithId[] = gameModel.languages
        .filter(gmLang => {
          const s = state.langs[gmLang.code];
          return s !== undefined && s !== gmLang.active;
        })
        .map(gmLang => ({ ...gmLang, active: !gmLang.active, id: gmLang.id! }));

      if (toUpdate.length > 0) {
        dispatch(updateLanguages(toUpdate));
      }
    }
    onClose();
  }, [state, gameUnsaved, gameModelUnsaved, langsUnsaved, dispatch, gameModel, onClose]);

  if (gameModel == null || gameModel == 'LOADING') {
    return <InlineLoading />;
  } else {
    return (
      <FitSpace direction="column" overflow="auto">
        <FitSpace direction="column" overflow="auto">
          <Tabs>
            <Tab name="basic" label={i18n.basicSettings}>
              <GameBasicSettings
                game={game}
                gameModel={gameModel}
                onGameUpdate={updateGameCb}
                onGameModelUpdate={updateGameModelCb}
              />
            </Tab>
            <Tab name="advanced" label={i18n.advancedSettings}>
              <GameAdvancedSettings
                game={game}
                gameModel={gameModel}
                onGameUpdate={updateGameCb}
                onGameModelUpdate={updateGameModelCb}
              />
            </Tab>
            <Tab name="languages" label={i18n.langSettings}>
              <GameLanguageSettings gameModel={gameModel} onLangUpdate={updateLangCb} />
            </Tab>
          </Tabs>
        </FitSpace>
        <Flex justify="space-between" align="center">
          <div className={css({ margin: '10px', color: 'var(--warningColor)' })}>
            {gameUnsaved || gameModelUnsaved || langsUnsaved ? (
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
}
