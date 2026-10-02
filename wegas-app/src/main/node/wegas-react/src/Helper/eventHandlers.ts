/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * Handlers registered by client scripts (WegasEvents.addEventHandler), called
 * for every event of their type that reaches the client.
 *
 * Deliberately not redux state: they are callbacks, nothing renders from them,
 * and they are only ever read imperatively when an event arrives.
 */
const handlers: WegasEventHandlers = {
  ExceptionEvent: {},
  ClientEvent: {},
  CustomEvent: {},
  EntityDestroyedEvent: {},
  EntityUpdatedEvent: {},
  OutdatedEntitiesEvent: {},
};

/**
 * Register a handler. An id already registered for that type is kept: the
 * first registration wins, so re-running a script does not stack handlers.
 */
export function addEventHandler(
  type: keyof WegasEvents,
  id: string,
  cb: WegasEventHandler,
) {
  if (handlers[type][id] == null) {
    handlers[type][id] = cb;
  }
}

export function removeEventHandler(type: keyof WegasEvents, id: string) {
  delete handlers[type][id];
}

export function triggerEventHandlers(event: WegasEvent) {
  for (const handler of Object.values(handlers[event['@class']])) {
    handler(event);
  }
}