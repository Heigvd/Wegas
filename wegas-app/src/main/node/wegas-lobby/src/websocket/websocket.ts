import { createAsyncThunk } from '@reduxjs/toolkit';
import Pusher from 'pusher-js/with-encryption/';
import * as React from 'react';
import {
  IAbstractEntity,
  IGameModelWithId,
  IGameWithId,
  IPermissionWithId,
  IPlayerWithId,
  ITeamWithId,
} from 'wegas-ts-api';
import { entityIs } from '../API/entityHelper';
import { getLogger } from '../logger';
import { getStore, WegasLobbyState } from '../store/store';

const logger = getLogger('websockets');

//logger.setLevel(3);

export const CHANNEL_PREFIX = {
  Admin: 'private-LobbyAdministrator',
  Global: 'global-channel',
  User: (userId: number) => `private-User-${userId}`,
  Role: (roleName: string) => `private-Role-${roleName}`,
  Player: 'private-Player-',
  Team: 'private-Team-',
  Game: 'private-Game-',
  GameModel: 'private-GameModel-',
};

let client: WebSocketListener | null = null;

export function getPusherClient() {
  return client;
}

function Uint8ArrayToStr(array: Uint8Array) {
  // http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
  /* utf.js - UTF-8 <=> UTF-16 convertion
   *
   * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
   * Version: 1.0
   * LastModified: Dec 25 1999
   * This library is free.  You can redistribute it and/or modify it.
   */
  let out, i, c;
  let char2, char3;

  out = '';
  const len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0),
        );
        break;
    }
  }

  return out;
}
async function processEvent(
  event: string,
  data: string | {},
): Promise<{
  event: string;
  data: string | {};
}> {
  if (event.endsWith('.gz') && typeof data === 'string') {
    const ba = [];
    const d = atob(data);
    for (let i = 0; i < d.length; i += 1) {
      ba.push(d.charCodeAt(i));
    }
    const compressed = new Uint8Array(ba);

    return {
      event: event.slice(0, -3),
      data: JSON.parse(Uint8ArrayToStr(await import('pako').then(p => p.inflate(compressed)))),
    };
  }
  return { event, data };
}
const webSocketEvents = [
  'EntityUpdatedEvent',
  'EntityDestroyedEvent',
  'populateQueue-dec',
  'LifeCycleEvent',
] as const;

export type WebSocketEvent = typeof webSocketEvents[number];

interface EventMap {
  [eventId: string]: ((
    data: any, //eslint-disable-line @typescript-eslint/no-explicit-any
  ) => void)[];
}

export const setPusherStatus = createAsyncThunk(
  'pusher/setStatus',
  async (payload: { status: string; socketId: string }, thunkApi) => {
    const pusherClient = getPusherClient();
    const state = thunkApi.getState() as WegasLobbyState;
    logger.log(
      'WS API reload current user',
      pusherClient != null ? 'client ok' : 'client n/a',
      'user id: ',
      state.auth.currentUserId,
    );
    if (payload.status === 'connected' || state.pusher.pusherStatus === 'disconnected') {
      if (pusherClient != null && payload.socketId) {
        if (state.auth.currentUserId != null) {
          if (state.auth.isAdmin) {
            pusherClient.bindChannel(CHANNEL_PREFIX.Admin);
          }
          // Websocket session is ready AND currentUser just changed
          // subscribe to the new current user channel ASAP
          pusherClient.bindChannel(CHANNEL_PREFIX.User(state.auth.currentUserId));
          const roleIds = state.users.userRoles[state.auth.currentUserId];
          if (roleIds != null && roleIds != 'LOADING') {
            roleIds.forEach(rId => {
              const role = state.users.roles[rId];
              if (entityIs(role, 'Role')) {
                pusherClient.bindChannel(CHANNEL_PREFIX.Role(role.name));
              }
            });
          }
        }
      }
    }
    return payload;
  },
);

export const setApiStatus = createAsyncThunk(
  'wegas/setApiStatus',
  async (payload: { status: 'UP' | 'DOWN' | 'OUTDATED' }) => {
    return payload;
  },
);

export const decQueue = createAsyncThunk('wegas/decQueue', async (amount: number) => {
  return amount;
});

export const reinitOnlineUsers = createAsyncThunk('admin/reinitOnlineUsers', async () => {});

export const outdateOnlineUsers = createAsyncThunk('admin/outdateOnlineUsers', async () => {});

export interface EntityBag {
  players: IPlayerWithId[];
  teams: ITeamWithId[];
  games: IGameWithId[];
  gameModels: IGameModelWithId[];
  permissions: IPermissionWithId[];
}

export const processUpdatedEntities = createAsyncThunk(
  'pusher/updatedEntities',
  async (payload: IAbstractEntity[]) => {
    const bag: EntityBag = {
      players: [],
      teams: [],
      games: [],
      gameModels: [],
      permissions: [],
    };
    payload.forEach(entity => {
      logger.log('Updated entity: ', entity);
      if (entity.id != null) {
        if (entityIs(entity, 'Player')) {
          bag.players.push(entity as IPlayerWithId);
        } else if (entityIs(entity, 'Team')) {
          bag.teams.push(entity as ITeamWithId);
        } else if (entityIs(entity, 'Game')) {
          bag.games.push(entity as IGameWithId);
        } else if (entityIs(entity, 'GameModel')) {
          bag.gameModels.push(entity as IGameModelWithId);
        } else if (entityIs(entity, 'Permission')) {
          bag.permissions.push(entity as IPermissionWithId);
        }
      }
    });
    return bag;
  },
);

interface IndexEntry {
  '@class': IAbstractEntity['@class'];
  id: number;
}
export interface IndexEntryBag {
  players: number[];
  teams: number[];
  games: number[];
  gameModels: number[];
  permissions: number[];
}

export const processDeletedEntities = createAsyncThunk(
  'pusher/deletedEntities',
  async (payload: IndexEntry[]) => {
    const bag: IndexEntryBag = {
      players: [],
      teams: [],
      games: [],
      gameModels: [],
      permissions: [],
    };
    payload.forEach(entity => {
      if (entity.id != null) {
        if (entityIs(entity, 'Player')) {
          bag.players.push(entity.id);
        } else if (entityIs(entity, 'Team')) {
          bag.teams.push(entity.id);
        } else if (entityIs(entity, 'Game')) {
          bag.games.push(entity.id);
        } else if (entityIs(entity, 'GameModel')) {
          bag.gameModels.push(entity.id);
        } else if (entityIs(entity, 'Permission')) {
          bag.permissions.push(entity.id);
        }
      }
    });
    return bag;
  },
);

/**
 *
 *
 * @export
 * @class WebSocketListener
 */
export class WebSocketListener {
  socketId: string;
  status: any; //eslint-disable-line @typescript-eslint/no-explicit-any
  events: EventMap = {};

  private socket: Pusher | null = null;

  constructor(applicationKey: string, authEndpoint: string, cluster: string) {
    for (const eventId of webSocketEvents) {
      this.events[eventId] = [];
    }
    this.socket = new Pusher(applicationKey, {
      cluster,
      authEndpoint,
    });
    this.socketId = this.socket.connection.socket_id;
    this.socket.connection.bind('state_change', (state: { current: unknown }) => {
      this.status = state.current;
      this.socketId = this.socket!.connection.socket_id;
      logger.log('Statechanged ', this.status, this.socketId);

      getStore().dispatch(
        setPusherStatus({
          status: String(state.current),
          socketId: this.socketId,
        }),
      );
    });
    this.bindChannel(CHANNEL_PREFIX.Global, this.socket);
  }

  public bindChannel(channelId: string, socket: Pusher | null = this.socket) {
    logger.log('subscribe to ', channelId);
    socket!.subscribe(channelId).bind_global(async (event: string, data: {}) => {
      const processed = await processEvent(event, data);
      if (processed.event.startsWith('pusher:')) {
        //pusher events
        return;
      }
      this.eventReceived(processed.event as WebSocketEvent, processed.data);
    });
  }

  public unbindChannel(channelId: string) {
    this.socket!.unsubscribe(channelId);
  }

  public unbindAllChannels() {
    this.socket!.allChannels().forEach(channel => {
      // do not unsubscribe from global channel ever
      if (channel.name !== CHANNEL_PREFIX.Global) {
        this.socket!.unsubscribe(channel.name);
      }
    });
    this.events = {};
  }

  public bindEvent(eventId: string, callback: (data: unknown) => void) {
    if (this.events[eventId]) {
      this.events[eventId].push(callback);
    } else {
      this.events[eventId] = [callback];
    }
  }

  public unbindCallback(eventId: string, callback: (data: unknown) => void) {
    if (this.events[eventId]) {
      this.events[eventId] = this.events[eventId].filter(el => el !== callback);
    } else {
      logger.warn(`Unknown event ${eventId}`);
    }
  }

  private eventReceived(event: WebSocketEvent, data: unknown) {
    let eventFound = false;
    // Dispatch outisde managed events
    if (this.events[event] !== undefined) {
      eventFound = Object.keys(this.events[event]).length > 0;
      for (const callback of this.events[event]) {
        callback(data);
      }
    }

    // Dispatch inside managed events... (may be simplified)
    // see : websocketFacade.java , EntityUpdatedEvent.java
    if (event === 'EntityUpdatedEvent') {
      const uData = data as { updatedEntities: IAbstractEntity[] };
      getStore().dispatch(processUpdatedEntities(uData.updatedEntities));
      return;
    } else if (event === 'EntityDestroyedEvent') {
      const dData = data as { deletedEntities: IndexEntry[] };
      getStore().dispatch(processDeletedEntities(dData.deletedEntities));
      return;
    } else if (event === 'LifeCycleEvent') {
      const apiStatus = data as { status: 'UP' | 'DOWN' | 'OUTDATED' };
      getStore().dispatch(setApiStatus(apiStatus));
      logger.log('Lifecycle: ', apiStatus);
      return;
    } else if (event === 'populateQueue-dec') {
      const amount = data as number;
      logger.log(`Population Queue -  ${amount}`);
      getStore().dispatch(decQueue(amount));
      return;
    } else if (event === 'online-users') {
      getStore().dispatch(outdateOnlineUsers());
    } else {
      if (!eventFound) {
        logger.error(`Event [${event}] unchecked`, data);
      }
    }
  }
  destructor() {
    this.socket!.disconnect();
  }
}

export const initPusherSocket = (appId: string, endpoint: string, cluster: string) => {
  client = new WebSocketListener(appId, endpoint, cluster);
  return client;
};

export const useWebsocketEvent = (event: WebSocketEvent | string, cb: (data: unknown) => void) => {
  React.useEffect(() => {
    if (client != null) {
      client.bindEvent(event, cb);
      return () => {
        if (client != null) {
          client.unbindCallback(event, cb);
        }
      };
    }
  }, [event, cb]);
  return client;
};

export const useWebsocketChannel = (channel: string) => {
  React.useEffect(() => {
    if (client != null) {
      client.bindChannel(channel);
    }
    return () => {
      if (client != null) {
        client.unbindChannel(channel);
      }
    };
  }, [channel]);
};

export const useWebsocket = (channel: string, event: string, cb: (data: unknown) => void) => {
  useWebsocketChannel(channel);
  return useWebsocketEvent(event, cb);
};
