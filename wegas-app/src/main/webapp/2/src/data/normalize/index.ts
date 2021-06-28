import {
  IVariableDescriptor,
  IVariableInstance,
  IGameModel,
  IGame,
  IPlayer,
  ITeam,
  IAbstractEntity,
} from 'wegas-ts-api/typings/WegasEntities';
import { wwarn } from '../../Helper/wegaslog';

export interface NormalizedData {
  variableDescriptors: {
    [id: string]: IVariableDescriptor;
  };
  variableInstances: {
    [id: string]: IVariableInstance;
  };
  gameModels: {
    [id: string]: IGameModel;
  };
  games: {
    [id: string]: IGame;
  };
  players: {
    [id: string]: IPlayer;
  };
  teams: {
    [id: string]: ITeam;
  };
}

type RootType = NormalizedData[keyof NormalizedData][0];
export const discriminant = (input: {
  '@class': string;
}): keyof NormalizedData | undefined => {
  const cls: string = input['@class'];
  if (cls === 'GameModel') {
    return 'gameModels';
  }
  if (cls === 'Game' || cls === 'DebugGame') {
    return 'games';
  }
  if (cls === 'Player') {
    return 'players';
  }
  if (cls === 'Team' || cls === 'DebugTeam') {
    return 'teams';
  }
  if (cls.endsWith('Descriptor')) {
    return 'variableDescriptors';
  }
  if (cls.endsWith('Instance')) {
    return 'variableInstances';
  }
  wwarn(`${cls} not handled`);
  return undefined;
};

export function normalizeDatas(data: IAbstractEntity[] = []): NormalizedData {
  return data.reduce(
    (prev, variable) => {
      const key = discriminant(variable);
      if (key != null) {
        prev[key][variable.id!] = variable as RootType;
      }
      return prev;
    },
    {
      variableDescriptors: {},
      variableInstances: {},
      gameModels: {},
      games: {},
      players: {},
      teams: {},
    } as NormalizedData,
  );
}
