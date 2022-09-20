import { IAbstractEntity } from 'wegas-ts-api';
import { store } from '../data/Stores/store';

type ContentType =
  | 'application/json'
  | 'text/plain'
  | 'multipart/form-data'
  | undefined;

function COMMON_CONFIG(
  contentType?: ContentType,
  managed: boolean = false,
): RequestInit {
  const socket_id = store.getState().global.pusherStatus.socket_id;

  let HEADERS;
  if (contentType) {
    HEADERS = new Headers({
      'Content-Type': contentType,
      'Managed-Mode': String(managed),
    });
  } else {
    HEADERS = new Headers({
      'Managed-Mode': String(managed),
    });
  }

  if (socket_id != null) {
    HEADERS.set('SocketId', socket_id);
  }
  return {
    credentials: 'same-origin',
    headers: HEADERS,
  };
}

export interface DestroyedEntity {
  '@class': IAbstractEntity['@class'];
  id: number;
}

export interface IManagedResponse {
  '@class': 'ManagedResponse';
  deletedEntities: DestroyedEntity[];
  updatedEntities: unknown[];
  events: WegasEvent[];
}

export function rest(
  url: string,
  options: RequestInit = {},
  view: View | false = API_VIEW,
  contentType: ContentType = 'application/json',
) {
  let type: ContentType = contentType;
  if (contentType === 'multipart/form-data') {
    type = undefined;
    if (!(options.body instanceof FormData)) {
      throw Error(
        "options.body must be FormData when contentType is 'multipart/form-data'",
      );
    }
  }
  const v = view ? `${view}/` : '';
  const u = url.startsWith('/') ? url.substring(1) : url;
  return fetch(`${API_ENDPOINT}${v}${u}`, {
    ...COMMON_CONFIG(type),
    ...options,
  }).then(res => {
    if (res.ok) {
      return res;
    }
    throw res;
  });
}

export function managedModeRequest(
  url: string,
  options: RequestInit = {},
  view?: View | false,
  contentType: ContentType = 'application/json',
) {
  return rest(
    url,
    {
      ...COMMON_CONFIG(contentType, true),
      ...options,
    },
    view,
    contentType,
  )
    .then(data => data.json() as Promise<IManagedResponse>)
    .catch(data => data.json() as Promise<IManagedResponse>);
}

/**
 * Check if exception match the partial pattern
 */
function exceptionMatch(
  ex: WegasExceptions,
  pattern: Partial<WegasExceptions>,
): boolean {
  const keysToCheck = Object.keys(pattern);
  for (const key of keysToCheck) {
    if (
      (ex as unknown as Record<string, unknown>)[key] !==
      (pattern as unknown as Record<string, unknown>)[key]
    ) {
      // property does not match
      return false;
    }
  }

  return true;
}

export function extractExceptions(
  managedResponse: IManagedResponse,
  exceptionsToExtract: Partial<WegasExceptions>[],
): { managedResponse: IManagedResponse; exceptionsFound: WegasExceptions[] } {
  // Extract known error
  const remainingEvents: WegasEvent[] = [];
  const exceptionsFound: WegasExceptions[] = [];

  managedResponse.events.forEach(event => {
    if (event['@class'] === 'ExceptionEvent') {
      const ex = event.exceptions.reduce<{
        extract: WegasExceptions[];
        keep: WegasExceptions[];
      }>(
        (acc, cur) => {
          if (
            exceptionsToExtract.find(pattern => exceptionMatch(cur, pattern))
          ) {
            acc.extract.push(cur);
          } else {
            acc.keep.push(cur);
          }
          return acc;
        },
        { extract: [], keep: [] },
      );

      if (ex.keep.length > 0) {
        // some unhandled exception, keep event minus extract exceptions
        remainingEvents.push({ ...event, exceptions: ex.keep });
      }

      if (ex.extract.length > 0) {
        exceptionsFound.push(...ex.extract);
      }
    } else {
      // event not extracted
      remainingEvents.push(event);
    }
  });

  const cleanedManagedResponse: IManagedResponse = {
    ...managedResponse,
    events: remainingEvents,
  };

  return { managedResponse: cleanedManagedResponse, exceptionsFound };
}
