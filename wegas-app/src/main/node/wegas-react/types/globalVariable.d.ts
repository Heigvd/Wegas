type View = 'Editor' | 'Instance' | 'Export' | 'Public';
type AppContext = 'Editor' | 'Player' | 'Trainer';

// Injected Variables
declare const CurrentUser: import('wegas-ts-api').IUser;
declare const CurrentGM: import('wegas-ts-api').IGameModel;
declare const CurrentGame: import('wegas-ts-api').IGame;
declare const CurrentPlayerId: number;
declare const CurrentTeamId: number;
declare const WEGAS_SAFE_MODE : boolean | undefined;
declare const API_ENDPOINT: string;
declare const API_VIEW: View;
declare const APP_CONTEXT: AppContext;
declare const PusherApp: {
  authEndpoint: string;
  applicationKey: string;
  cluster: string;
};
