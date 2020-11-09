type View = 'Editor' | 'Instance' | 'Export' | 'Public';

// Injected Variables
declare const CurrentUser: import('wegas-ts-api').IUser;
declare const CurrentGM: import('wegas-ts-api').IGameModel;
declare const CurrentGame: import('wegas-ts-api').IGame;
declare const CurrentPlayerId: number;
declare const CurrentTeamId: number;
declare const API_ENDPOINT: string;
declare const API_VIEW: View;
declare const PusherApp: {
  authEndpoint: string;
  applicationKey: string;
  cluster: string;
};
