// import PusherConstructor, { Pusher } from 'pusher-js';
// import { inflate } from 'pako';
import { store } from '../data/store';
import { updatePusherStatus } from '../data/Reducer/globalState';
import { managedMode } from '../data/actions';
import { Actions } from '../data';
import { omit } from 'lodash';

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
      data: Uint8ArrayToStr(
        await import('pako').then(p => p.inflate(compressed)),
      ),
    };
  }
  return { event, data };
}

export type WebSocketEvent =
  | 'EntityUpdatedEvent'
  | 'EntityDestroyedEvent'
  | 'CustomEvent'
  | 'PageUpdate'
  | 'LibraryUpdate-CSS'
  | 'LibraryUpdate-ClientScript'
  | 'LibraryUpdate-ServerScript';

const webSocketEvents: WebSocketEvent[] = [
  'EntityUpdatedEvent',
  'EntityDestroyedEvent',
  'CustomEvent',
  'PageUpdate',
  'LibraryUpdate-CSS',
  'LibraryUpdate-ClientScript',
  'LibraryUpdate-ServerScript',
];

interface EventMap {
  [eventId: string]: {
    [handlerId: string]: (
      data: any, //eslint-disable-line @typescript-eslint/no-explicit-any
    ) => void;
  };
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
      this.events[eventId] = {};
    }
    import('pusher-js').then(Pusher => {
      this.socket = new Pusher.default(applicationKey, {
        cluster,
        authEndpoint,
        encrypted: true,
      });
      this.socket.connection.bind('state_change', (
        state: any, //eslint-disable-line @typescript-eslint/no-explicit-any
      ) => {
        this.status = state.current;
        this.socketId = this.socket!.connection.socket_id;
        store.dispatch(updatePusherStatus(state.current, this.socketId));
      });
      const channels = [
        CHANNEL_PREFIX.GameModel + CurrentGM.id,
        CHANNEL_PREFIX.Game + CurrentGame.id,
        CHANNEL_PREFIX.Player + CurrentPlayerId,
        CHANNEL_PREFIX.Team + CurrentTeamId,
        CHANNEL_PREFIX.User + CurrentUser.id,
      ];

      channels.forEach(chan =>
        this.socket!.subscribe(chan).bind_global(
          async (event: string, data: {}) => {
            const processed = await processEvent(event, data);
            if (processed.event.startsWith('pusher:')) {
              //pusher events
              return;
            }
            this.eventReveived(
              processed.event as WebSocketEvent,
              processed.data,
            );
          },
        ),
      );
    });
  }
  public insertCallback(
    eventId: WebSocketEvent,
    handlerId: string,
    callBack: (
      data: any, //eslint-disable-line @typescript-eslint/no-explicit-any
    ) => void,
  ) {
    if (this.events[eventId][handlerId] !== undefined) {
      return false;
    } else {
      this.events[eventId][handlerId] = callBack;
      return true;
    }
  }

  public removeCallback(eventId: WebSocketEvent, handlerId: string) {
    if (this.events[eventId][handlerId] !== undefined) {
      this.events[eventId] = omit(this.events[eventId], handlerId);
      return true;
    } else {
      return false;
    }
  }

  private eventReveived(
    event: WebSocketEvent,
    data: any, //eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    // Dispatch outisde managed events
    if (this.events[event] !== undefined) {
      for (const handlerId of Object.keys(this.events[event])) {
        this.events[event][handlerId](data);
      }
    }

    // Dispatch inside managed events... (may be simplified)
    switch (event) {
      case 'EntityUpdatedEvent':
      case 'EntityDestroyedEvent':
      case 'CustomEvent':
        return store.dispatch(
          managedMode({
            '@class': 'ManagedResponse',
            deletedEntities: data.deletedEntities,
            updatedEntities: data.updatedEntities,
            events: data.events,
          }),
        );
      case 'LibraryUpdate-CSS':
      case 'LibraryUpdate-ClientScript':
      case 'LibraryUpdate-ServerScript':
        return;
      case 'PageUpdate':
        store.dispatch(Actions.PageActions.get(data));
        return;
      default:
        throw Error(`Event [${event}] unchecked`);
    }
  }
  destructor() {
    this.socket!.disconnect();
  }
}

export default class SingletonWebSocket {
  listener: WebSocketListener | null = null;
  constructor() {
    if (this.listener === null) {
      this.listener = new WebSocketListener(
        PusherApp.applicationKey,
        PusherApp.authEndpoint,
        PusherApp.cluster,
      );
    }
  }
  public insertCallback(
    eventId: WebSocketEvent,
    handlerId: string,
    callBack: (
      data: any, //eslint-disable-line @typescript-eslint/no-explicit-any
    ) => void,
  ) {
    return this.listener!.insertCallback(eventId, handlerId, callBack);
  }
  public removeCallback(eventId: WebSocketEvent, handlerId: string) {
    return this.listener!.removeCallback(eventId, handlerId);
  }
}
