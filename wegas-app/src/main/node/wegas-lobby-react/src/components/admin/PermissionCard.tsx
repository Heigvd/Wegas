/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faCheckSquare, faPen, faSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import Select from 'react-select';
import { IGameModelWithId, IPermission, IPermissionWithId } from 'wegas-ts-api';
import {
  deletePermission,
  getGameById,
  getGameModelById,
  getGameModels,
  getGames,
  updatePermission,
} from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import {
  usePermissionObject,
  useShareableGameModels,
  useShareableGames,
} from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Button from '../common/Button';
import Card from '../common/Card';
import CardContainer from '../common/CardContainer';
import Checkbox from '../common/Checkbox';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import OpenCloseModal from '../common/OpenCloseModal';
import { cardDetailsStyle, cardTitleStyle, mainButtonStyle } from '../styling/style';

interface GmPermissionEditorProps {
  value: string;
  id: number | '*' | undefined;
  onChange: (value: { value: string; id: number | '*' }) => void;
}

interface PermIdOption {
  value: number | '*';
  label: string;
}

function prettyPrintType(gameModel: IGameModelWithId): string {
  // TODO: i18n
  switch (gameModel.type) {
    case 'MODEL':
      return 'Model';
    case 'REFERENCE':
      return 'ModelReference';
    case 'SCENARIO':
      return 'Scenario';
    case 'PLAY':
      return 'Scenario of game';
  }
}

function prettyPrintStatus(gameModel: Pick<IGameModelWithId, 'status'>): string {
  // TODO: i18n
  switch (gameModel.status) {
    case 'LIVE':
      return 'Current';
    case 'BIN':
      return 'Archived';
    case 'DELETE':
      return 'Trash';
    case 'SUPPRESSED':
      return 'Definitively deleted';
  }
}

const baseGmPerm = ['Edit', 'Duplicate', 'Instantiate'];
const allGmPerm = 'View,Edit,Delete,Duplicate,Instantiate';

export function GameModelPermissionEditor({
  value,
  id,
  onChange,
}: GmPermissionEditorProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const userId = currentUser != null ? currentUser.id : undefined;

  const gameModels = useShareableGameModels(userId);

  const mStatus = gameModels.status.MODEL.LIVE;
  const sStatus = gameModels.status.SCENARIO.LIVE;

  const [gameModelId, setGameModelId] = React.useState<number | '*' | undefined>(id);

  const [permState, setPermState] = React.useState(
    value.split(',').reduce<Record<string, boolean>>((acc, cur) => {
      acc[cur] = true;
      return acc;
    }, {}),
  );

  const gameModel = Number.isInteger(gameModelId)
    ? gameModels.gamemodels.find(gm => gm.id === +gameModelId!)
    : undefined;

  const [gmPerm, setGmPerm] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (gameModel != null) {
      setGmPerm([...baseGmPerm, ...gameModel.languages.map(lang => `Translate-${lang.code}`)]);
    } else {
      setGmPerm([...baseGmPerm]);
    }
  }, [gameModel]);

  React.useEffect(() => {
    if (permState['Edit']) {
      setPermState(current => {
        const newState = { ...current };
        gmPerm.forEach(perm => (newState[perm] = true));
        return newState;
      });
    }
  }, [gmPerm, permState]);

  React.useEffect(() => {
    if (gameModelId != null) {
      if (permState['Edit']) {
        onChange({
          id: gameModelId,
          value: allGmPerm,
        });
      } else {
        onChange({
          id: gameModelId,
          value: gmPerm.flatMap(perm => (permState[perm] ? [perm] : [])).join(','),
        });
      }
    }
  }, [permState, gmPerm, gameModelId, onChange]);

  React.useEffect(() => {
    if (sStatus == 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: 'LIVE', type: 'SCENARIO' }));
    }

    if (mStatus == 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: 'LIVE', type: 'MODEL' }));
    }
  }, [sStatus, mStatus, dispatch]);

  const selectGameModelCb = React.useCallback((value: PermIdOption | null) => {
    if (value != null) {
      setGameModelId(value.value);
    } else {
      setGameModelId(undefined);
    }
  }, []);

  const options: PermIdOption[] = gameModels.gamemodels
    .map(gm => {
      return {
        value: gm.id,
        label: `${gm.name}  [${prettyPrintStatus(gm)} ${prettyPrintType(gm)}]`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  options.unshift({
    value: '*',
    label: i18n.all,
  });

  const current = options.find(opt => opt.value === gameModelId);

  const togglePermCb = React.useCallback(
    (perm: string) => {
      setPermState(state => {
        const newState = { ...state, [perm]: !state[perm] };
        if (newState['Edit']) {
          gmPerm.forEach(perm => (newState[perm] = true));
        }
        return newState;
      });
    },
    [gmPerm],
  );

  function createCheckBox(name: string) {
    return (
      <Checkbox
        key={name}
        label={name}
        disabled={name != 'Edit' && permState['Edit']}
        value={permState[name]}
        onChange={() => {
          togglePermCb(name);
        }}
      />
    );
  }

  return (
    <>
      <Select options={options} isClearable={false} value={current} onChange={selectGameModelCb} />
      {gmPerm.map(perm => createCheckBox(perm))}
    </>
  );
}

export function GamePermissionEditor({ id, onChange }: GmPermissionEditorProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const userId = currentUser != null ? currentUser.id : undefined;

  const games = useShareableGames(userId);

  const liveStatus = games.status.LIVE;

  React.useEffect(() => {
    if (liveStatus == 'NOT_INITIALIZED') {
      dispatch(getGames('LIVE'));
    }
  }, [liveStatus, dispatch]);

  const selectGameCb = React.useCallback(
    (value: PermIdOption | null) => {
      if (value != null) {
        onChange({ value: 'View,Edit', id: value.value });
      }
    },
    [onChange],
  );

  const options: PermIdOption[] = games.games
    .map(g => {
      return {
        value: g.id,
        label: `${g.name}  [${prettyPrintStatus(g)}]`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  options.unshift({
    value: '*',
    label: i18n.all,
  });

  const current = options.find(opt => opt.value === id);

  return (
    <>
      <Select options={options} isClearable={false} value={current} onChange={selectGameCb} />
    </>
  );
}

interface PermissionEditorProps {
  permission: IPermission;
  pType: 'Game' | 'GameModel';
  value: string;
  id: number | '*' | undefined;
  close: () => void;
  onSave: (permission: IPermission) => void;
}

export function PermissionEditor({
  permission,
  pType,
  value,
  id,
  onSave,
}: PermissionEditorProps): JSX.Element {
  const i18n = useTranslations();

  const [typeState, setType] = React.useState<'Game' | 'GameModel'>(pType);

  const [valueState, setValue] = React.useState(value);
  const [gmIdState, setGmId] = React.useState(pType === 'GameModel' ? id : undefined);
  const [gIdState, setGId] = React.useState(pType === 'Game' ? id : undefined);

  const toggleType = React.useCallback(() => {
    setType(current => (current === 'Game' ? 'GameModel' : 'Game'));
  }, []);

  return (
    <FitSpace direction="column">
      <CardContainer>
        <IconButton
          icon={typeState === 'GameModel' ? faCheckSquare : faSquare}
          onClick={toggleType}
        >
          GameModel
        </IconButton>
        <IconButton icon={typeState === 'Game' ? faCheckSquare : faSquare} onClick={toggleType}>
          Game
        </IconButton>
        {typeState === 'GameModel' ? (
          <GameModelPermissionEditor
            value={valueState}
            id={gmIdState}
            onChange={v => {
              setValue(v.value);
              setGmId(v.id);
            }}
          />
        ) : (
          <GamePermissionEditor
            value={valueState}
            id={gIdState}
            onChange={v => {
              setValue(v.value);
              setGId(v.id);
            }}
          />
        )}
        <Flex justify="flex-end">
          <i>{`${typeState}:${valueState}:${gmIdState}|${gIdState}`}</i>
          <Button
            className={mainButtonStyle}
            label={i18n.save}
            onClick={() => {
              const newPerm =
                typeState === 'GameModel'
                  ? `${typeState}:${valueState}:gm${gmIdState}`
                  : `${typeState}:${valueState}:g${gIdState}`;
              onSave({ ...permission, value: newPerm });
            }}
          />
        </Flex>
      </CardContainer>
    </FitSpace>
  );
}

interface PermissionCardProps {
  permission: IPermissionWithId;
}

export function PermissionCard({ permission }: PermissionCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const split = permission.value.split(':');

  const pType = split[0];
  const value = split[1];
  const id = split[2];

  const data = usePermissionObject(id);

  const game = data.type === 'Game' ? data.game : undefined;
  const gameModel = data.type === 'GameModel' ? data.gameModel : undefined;
  const oId = data.type === 'GameModel' || data.type === 'Game' ? data.id : undefined;

  React.useEffect(() => {
    if (data.type === 'GameModel' && gameModel == null && oId != null) {
      dispatch(getGameModelById(oId));
    }

    if (data.type === 'Game' && game == null && oId != null) {
      dispatch(getGameById(oId));
    }
  }, [dispatch, game, gameModel, data.type, oId]);

  const destroyCb = React.useCallback(async () => {
    return dispatch(deletePermission(permission.id));
  }, [permission.id, dispatch]);

  const name = entityIs(gameModel, 'GameModel') ? (
    `${
      gameModel.type === 'MODEL'
        ? i18n.Model
        : gameModel.type === 'SCENARIO'
        ? i18n.GameModel
        : gameModel.type
    } "${gameModel.name}"`
  ) : entityIs(game, 'Game') ? (
    `${i18n.Game} "${game.name}"`
  ) : data.type === 'WILDCARD' ? (
    pType === 'Game' ? (
      i18n.allGames
    ) : pType === 'GameModel' ? (
      i18n.allGameModels
    ) : (
      `${i18n.all} ${pType}`
    )
  ) : (
    <i>
      {i18n.unknown}: {permission.value}
    </i>
  );

  return (
    <Card size="SMALL" key={permission.id} illustration="ICON_grey_key_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{name}</div>
        <div className={cardDetailsStyle}>{value}</div>
      </FitSpace>

      {pType === 'Game' || pType === 'GameModel' ? (
        <OpenCloseModal
          icon={faPen}
          iconTitle={i18n.editPermission}
          title={i18n.editPermission}
          illustration="ICON_dark-blue_key_fa"
          showCloseButton={true}
          route={`/${permission.id}/edit`}
        >
          {close => (
            <PermissionEditor
              permission={permission}
              pType={pType}
              value={value}
              id={oId}
              onSave={p => {
                if (p.id != null) {
                  dispatch(updatePermission(p as IPermissionWithId)).then(a => {
                    if (a.meta.requestStatus === 'fulfilled') {
                      close();
                    }
                  });
                }
              }}
              close={close}
            />
          )}
        </OpenCloseModal>
      ) : null}

      <ActionIconButton shouldConfirm icon={faTrash} onClick={destroyCb} />
    </Card>
  );
}
