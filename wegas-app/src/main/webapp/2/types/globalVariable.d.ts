type View = 'Editor' | 'Instance' | 'Export';

// Injected Variables
declare const CurrentUser: IUser;
declare const CurrentGM: IGameModel;
declare const CurrentGame: IGame;
declare const CurrentPlayerId: number;
declare const CurrentTeamId: number;
declare const API_ENDPOINT: string;
declare const API_VIEW: View;
declare const PusherApp: {
  authEndpoint: string;
  applicationKey: string;
  cluster: string;
};
