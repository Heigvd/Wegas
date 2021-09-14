/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faCodeBranch, faDownload, faRedo, faTrash } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { IGameModelWithId } from 'wegas-ts-api';
import { createVersion, deleteVersion, getRestClient, restoreVersion } from '../../API/api';
import { GameModelVersion } from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card, { cardSecButtonStyle } from '../common/Card';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import { buttonStyle, cardDetailsStyle, cardTitleStyle, secButtonStyle } from '../styling/style';

interface VersionCardProps {
  gameModel: IGameModelWithId;
  version: GameModelVersion;
  closePanel: () => void;
  reload: () => void;
}

function VersionCard({ gameModel, version, reload }: VersionCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const restoreCb = React.useCallback(async () => {
    return dispatch(restoreVersion({ gameModelId: gameModel.id, name: version.name })).then(() => {
      reload();
    });
  }, [gameModel.id, dispatch, reload, version.name]);

  const deleteCb = React.useCallback(async () => {
    return dispatch(deleteVersion({ gameModelId: gameModel.id, name: version.name })).then(() => {
      reload();
    });
  }, [gameModel.id, dispatch, reload, version.name]);

  return (
    <Card illustration="ICON_dark-blue_code-branch_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{version.name}</div>
        <div className={cardDetailsStyle}>{version.path}</div>
      </FitSpace>

      <ActionIconButton
        className={cardSecButtonStyle}
        icon={faRedo}
        title={i18n.restoreVersion}
        onClick={restoreCb}
      />
      <ActionIconButton
        shouldConfirm
        className={cardSecButtonStyle}
        icon={faTrash}
        title={i18n.deleteVersion}
        onClick={deleteCb}
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
  const [versions, setVersions] = React.useState<
    'NOT_INITIALIZED' | 'LOADING' | GameModelVersion[]
  >('NOT_INITIALIZED');

  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  React.useEffect(() => {
    if (versions === 'NOT_INITIALIZED') {
      setVersions('LOADING');
      getRestClient()
        .HistoryController.getVersions(gameModel.id)
        .then(v => {
          setVersions(v);
        });
    }
  }, [versions, gameModel.id]);

  const createCb = React.useCallback(() => {
    dispatch(createVersion({ gameModelId: gameModel.id })).then(() =>
      setVersions('NOT_INITIALIZED'),
    );
  }, [gameModel.id, dispatch]);

  const reloadCb = React.useCallback(() => {
    setVersions('NOT_INITIALIZED');
  }, []);

  return (
    <FitSpace direction="column" overflow="auto">
      <CardContainer>
        <h4>{i18n.availableVersions}</h4>
        {typeof versions === 'string' ? (
          <InlineLoading />
        ) : (
          <>
            {versions.map(version => (
              <VersionCard
                key={version.name}
                closePanel={closePanel}
                reload={reloadCb}
                version={version}
                gameModel={gameModel}
              />
            ))}
          </>
        )}
      </CardContainer>
      <Flex overflow="auto" direction="row" justify="flex-end">
        <FitSpace direction="column">
          <IconButton
            className={cx(css({ alignSelf: 'flex-start' }), secButtonStyle)}
            icon={faCodeBranch}
            onClick={createCb}
          >
            {i18n.createVersion}
          </IconButton>
        </FitSpace>

        <IconButton
          title={i18n.pdf}
          className={buttonStyle}
          icon={faDownload}
          onClick={() => {
            window.open(
              `${APP_ENDPOINT}/print.html?gameModelId=${gameModel.id}&outputType=pdf&mode=editor&defaultValues=true`,
            );
          }}
        >
          {i18n.pdf}
        </IconButton>

        <IconButton
          title={i18n.exportWgz}
          className={buttonStyle}
          icon={faDownload}
          onClick={() => {
            window.open(`${API_ENDPOINT}/GameModel/${gameModel.id}.wgz`);
          }}
        >
          {i18n.exportWgz}
        </IconButton>

        <IconButton
          title={i18n.exportJson}
          className={buttonStyle}
          icon={faDownload}
          onClick={() => {
            window.open(
              `${API_ENDPOINT}/GameModel/${gameModel.id}/${encodeURIComponent(
                gameModel.name,
              )}.json`,
            );
          }}
        >
          {i18n.exportJson}
        </IconButton>
      </Flex>
    </FitSpace>
  );
}
