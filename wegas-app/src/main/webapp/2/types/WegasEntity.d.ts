interface IWegasEntity {
  readonly '@class': string;
  readonly id?: number;
}

interface IParentDescriptor extends IWegasEntity {
  itemsIds: number[];
}
interface IVersionable {
  version: number;
}
interface IScript {
  '@class': 'Script';
  content: string;
  language: 'JavaScript';
}
interface IGameModelLanguage extends IWegasEntity {
  '@class': 'GameModelLanguage';
  active: boolean;
  code: string;
  indexOrder: number;
  lang: string;
}
interface ITranslatableContent extends IWegasEntity {
  '@class': 'TranslatableContent';
  translations: {
    [refName: string]: { translation: string; status: string | null };
  };
}
interface IGameModelProperties {
  freeForAll: boolean;
  pagesUri: string;
  cssUri: string;
  websocket: string;
  logID: string;
  scriptUri: string;
  clientScriptUri: string;
  imageUri: string;
  iconUri: string;
}
interface IGameModel extends IWegasEntity, IParentDescriptor {
  '@class': 'GameModel';
  pages: any;
  name: string;
  description: string | null;
  comments: string | null;
  createdTime: number;
  scriptLibrary: any;
  uiversion: 1 | 2;
  languages: IGameModelLanguage[];
  cssLibrary: any;
  clientScriptLibrary: any;
  properties: IGameModelProperties;
  createdByName: string;
  type: IGameModelType;
}
interface IGame extends IWegasEntity {
  '@class': 'Game' | 'DebugGame';
  name: string;
  token: string;
  createdTime: number;
  updatedTime: number;
  teams: ITeam[];
  access: string;
  createdByName: string;
  gameModelName: string;
  gameModelId: number;
}
interface IAbstractAccount extends IWegasEntity {
  '@class': 'JPAAccount';
  name: string;
  username?: string;
  firstname: string;
  lastname: string;
  email: string;
  agreedTime: number;
  password: string | null;
  hash: string;
}
interface IUser extends IWegasEntity {
  '@class': 'User';
  name: string;
  accounts: IAbstractAccount[];
  players: IPlayer[];
}
interface IPlayer extends IWegasEntity, IVersionable {
  queueSize: number;
  name: string;
  joinTime: number;
  verifiedId: boolean;
  homeOrg: string;
  status: string;
  teamId: number;
  createdTime: number;
  userId: string;
  waiting: boolean;
}
interface ITeam extends IWegasEntity {
  name: string;
  createdTime: number;
  status: string;
  notes: string;
  declaredSize: number;
  players: IPlayer[];
  gameName: string;
  gameFreeForAll: boolean;
  gameIcon: string;
  gameId: number;
  waiting: boolean;
}
type IVisibility = 'INTERNAL' | 'PROTECTED' | 'INHERITED' | 'PRIVATE';
type IGameModelType = 'MODEL' | 'REFERENCE' | 'SCENARIO' | 'PLAY';
