// import PusherConstructor, { Pusher } from 'pusher-js';
// import { inflate } from 'pako';
import { store } from '../data/Stores/store';
import { editorEvent, updatePusherStatus } from '../data/Reducer/globalState';
import { manageResponseHandler } from '../data/actions';
import { Actions } from '../data';
import * as React from 'react';
import { werror, wwarn } from '../Helper/wegaslog';
import { IAbstractEntity } from 'wegas-ts-api';
import { entityIs } from '../data/entities';

const CHANNEL_PREFIX = {
  Admin: 'private-Admin',
  Global: 'global-channel',
  User: 'private-User-',
  Player: 'private-Player-',
  Team: 'private-Team-',
  Game: 'private-Game-',
  GameModel: 'private-GameModel-',
};
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
      data: JSON.parse(
        Uint8ArrayToStr(await import('pako').then(p => p.inflate(compressed))),
      ),
    };
  }
  return { event, data };
}
const webSocketEvents = [
  'EntityUpdatedEvent',
  'EntityDestroyedEvent',
  'CustomEvent',
  'PageUpdate',
  'LibraryUpdate-Theme',
  'LibraryUpdate-SelectedThemes',
  'LibraryUpdate-CSS',
  'LibraryUpdate-ClientScript',
  'LibraryUpdate-ServerScript',
  'LockEvent',
  'OutdatedEntitiesEvent',
  'populateQueue-dec',
] as const;

export type WebSocketEvent = ValueOf<typeof webSocketEvents>;

interface OutadatedEntitesEvent {
  '@class': 'OutdatedEntitiesEvent';
  updatedEntities: { type: WegasClassNames; id: number }[];
}

interface EventMap {
  [eventId: string]: ((
    data: any, //eslint-disable-line @typescript-eslint/no-explicit-any
  ) => void)[];
}

// interface ICustomEventData {
//   deletedEntities: IAbstractEntity[];
//   updatedEntities: IAbstractEntity[];
//   events: any[];
// }

export interface LockEventData {
  '@class': 'LockEvent';
  token: string;
  status: 'lock' | 'unlock';
}

/**
 *
 *
 * @export
 * @class WebSocketListener
 */
class WebSocketListener {
  socketId?: string;
  status: any; //eslint-disable-line @typescript-eslint/no-explicit-any
  events: EventMap = {};

  private socket: import('pusher-js').Pusher.PusherSocket | null = null;
  constructor(applicationKey: string, authEndpoint: string, cluster: string) {
    for (const eventId of webSocketEvents) {
      this.events[eventId] = [];
    }
    import('pusher-js').then(Pusher => {
      this.socket = new Pusher.default(applicationKey, {
        cluster,
        authEndpoint,
        encrypted: true,
      });
      this.socket.connection.bind(
        'state_change',
        (
          state: any, //eslint-disable-line @typescript-eslint/no-explicit-any
        ) => {
          this.status = state.current;
          this.socketId = this.socket!.connection.socket_id;
          store.dispatch(updatePusherStatus(state.current, this.socketId));
        },
      );
      const channels = [
        CHANNEL_PREFIX.GameModel + CurrentGM.id,
        CHANNEL_PREFIX.Game + CurrentGame.id,
        CHANNEL_PREFIX.Player + CurrentPlayerId,
        CHANNEL_PREFIX.Team + CurrentTeamId,
        CHANNEL_PREFIX.User + CurrentUser.id,
        'global-channel',
      ];
      channels.forEach(c => this.bindChannel(c, this.socket));
    });
  }

  public bindChannel(
    channelId: string,
    socket: import('pusher-js').Pusher.PusherSocket | null = this.socket,
  ) {
    socket!
      .subscribe(channelId)
      .bind_global(async (event: string, data: {}) => {
        const processed = await processEvent(event, data);
        if (processed.event.startsWith('pusher:')) {
          //pusher events
          return;
        }
        this.eventReveived(processed.event as WebSocketEvent, processed.data);
      });
    this.socket?.channels;
  }

  public unbindChannel(channelId: string) {
    this.socket!.unsubscribe(channelId);
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
      wwarn(`Unknown event ${eventId}`);
    }
  }

  private eventReveived(event: WebSocketEvent, data: unknown) {
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
    switch (event) {
      case 'EntityUpdatedEvent':
        return store.dispatch(
          manageResponseHandler(
            {
              '@class': 'ManagedResponse',
              deletedEntities: [],
              updatedEntities: (data as { updatedEntities: IAbstractEntity[] })
                .updatedEntities,
              events: [],
            },
            store.dispatch,
          ),
        );
      // {updatedEntities:{"@class":IAbstractEntity["@class"];id:number}[]}
      case 'EntityDestroyedEvent':
        return store.dispatch(
          manageResponseHandler(
            {
              '@class': 'ManagedResponse',
              deletedEntities: (
                data as {
                  deletedEntities: {
                    '@class': IAbstractEntity['@class'];
                    id: number;
                  }[];
                }
              ).deletedEntities,
              updatedEntities: [],
              events: [],
            },
            store.dispatch,
          ),
        );
      case 'OutdatedEntitiesEvent': {
        const { updatedEntities } = data as OutadatedEntitesEvent;

        const toUpdate: { instances: number[]; descriptors: number[] } = {
          instances: [],
          descriptors: [],
        };

        for (const updatedEntity of updatedEntities) {
          if (
            entityIs({ '@class': updatedEntity.type }, 'VariableInstance', true)
          ) {
            toUpdate.instances.push(updatedEntity.id);
          } else if (
            entityIs(
              { '@class': updatedEntity.type },
              'VariableDescriptor',
              true,
            )
          ) {
            toUpdate.descriptors.push(updatedEntity.id);
          }
        }

        if (toUpdate.instances.length > 0) {
          store.dispatch(
            Actions.VariableInstanceActions.getByIds(toUpdate.instances),
          );
        }

        if (toUpdate.descriptors.length > 0) {
          store.dispatch(
            Actions.VariableDescriptorActions.getByIds(toUpdate.descriptors),
          );
        }

        return;
      }
      case 'CustomEvent':
        return store.dispatch(editorEvent(data as CustomEvent));
      case 'PageUpdate':
        store.dispatch(Actions.PageActions.get(data as string));
        return;
      case 'LockEvent':
        store.dispatch(Actions.EditorActions.setLock(data as LockEventData));
        return;
      default:
        if (!eventFound) {
          werror(`Event [${event}] unchecked`);
        }
    }
  }
  destructor() {
    this.socket!.disconnect();
  }
}

const SingletonWebSocket = new WebSocketListener(
  PusherApp.applicationKey,
  PusherApp.authEndpoint,
  PusherApp.cluster,
);

export const useWebsocketEvent = (
  event: WebSocketEvent | string,
  cb: (data: unknown) => void,
) => {
  React.useEffect(() => {
    SingletonWebSocket.bindEvent(event, cb);
    return () => SingletonWebSocket.unbindCallback(event, cb);
  }, [event, cb]);
  return SingletonWebSocket;
};

export const useWebsocketChannel = (channel: string) => {
  React.useEffect(() => {
    SingletonWebSocket.bindChannel(channel);
    return () => SingletonWebSocket.unbindChannel(channel);
  }, [channel]);
  return SingletonWebSocket;
};

export const useWebsocket = (
  channel: string,
  event: string,
  cb: (data: unknown) => void,
) => {
  useWebsocketChannel(channel);
  return useWebsocketEvent(event, cb);
};

export function useLiveUpdate(
  variableIdToWatch: number | undefined,
  delay: number = 500,
) {
  const waitTimer = React.useRef<NodeJS.Timeout | null>();
  const [waitingState, setWaitingState] = React.useState(false);

  useWebsocketEvent(
    'CustomEvent',
    ({ payload }: { payload: IAbstractEntity }) => {
      if (variableIdToWatch != null && payload.id === variableIdToWatch) {
        setWaitingState(true);
        if (waitTimer.current != null) {
          clearTimeout(waitTimer.current);
        }
        waitTimer.current = setTimeout(() => {
          setWaitingState(false);
        }, delay);
      }
    },
  );
  return waitingState;
}
