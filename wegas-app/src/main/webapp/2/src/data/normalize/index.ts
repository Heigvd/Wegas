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

const discriminant = (input: { '@class': string }): keyof NormalizedData => {
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
  throw Error(`${cls} not handled`);
};

export function normalizeDatas(
  data: (IGameModel | IVariableInstance | IVariableDescriptor)[] = [],
): NormalizedData {
  return data.reduce(
    (prev, variable) => {
      prev[discriminant(variable)][variable.id!] = variable;
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
