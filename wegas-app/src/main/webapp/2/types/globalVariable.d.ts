type View = 'Editor' | 'Instance' | 'Export';

// Injected Variables
declare const CurrentUser: import('wegas-ts-api/typings/WegasEntities').IUser;
declare const CurrentGM: import('wegas-ts-api/typings/WegasEntities').IGameModel;
declare const CurrentGame: import('wegas-ts-api/typings/WegasEntities').IGame;
declare const CurrentPlayerId: number;
declare const CurrentTeamId: number;
declare const API_ENDPOINT: string;
declare const API_VIEW: View;
declare const PusherApp: {
  authEndpoint: string;
  applicationKey: string;
  cluster: string;
};
