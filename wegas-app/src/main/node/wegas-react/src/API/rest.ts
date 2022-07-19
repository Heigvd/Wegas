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

export function extractExceptions(
  managedResponse: IManagedResponse,
  exceptionsToExtract: Partial<WegasExceptions>[],
) {
  // Trying to extract known error
  const remainingExceptionsToExtract: (Partial<WegasExceptions> | null)[] = [
    ...exceptionsToExtract,
  ];
  const remainingEvents: WegasEvent[] = [];
  const exceptionsFound: (true | undefined)[] = [];
  for (const event of managedResponse.events) {
    if (event['@class'] === 'ExceptionEvent') {
      const remainingExceptions: WegasExceptions[] = [];
      for (const exception of event.exceptions) {
        for (let i = 0; i < remainingExceptionsToExtract.length; ++i) {
          const exceptionToExtract = remainingExceptionsToExtract[i];
          if (
            exceptionToExtract != null &&
            exception['@class'] === exceptionToExtract['@class']
          ) {
            if (
              exception['@class'] === 'WegasErrorMessage' &&
              exceptionToExtract['@class'] === 'WegasErrorMessage'
            ) {
              if (exception.messageId === exceptionToExtract.messageId) {
                exceptionsFound[i] = true;
                remainingExceptionsToExtract[i] = null;
              } else {
                remainingExceptions.push(exception);
              }
            } else {
              exceptionsFound[i] = true;
              remainingExceptionsToExtract[i] = null;
            }
          } else {
            remainingExceptions.push(exception);
          }
        }
      }
      // Only push exception event if he still has exceptions in it
      if (remainingExceptions.length > 0) {
        remainingEvents.push({
          ...event,
          exceptions: remainingExceptions,
        });
      }
    } else {
      remainingEvents.push(event);
    }
  }

  const cleanedManagedResponse: IManagedResponse = {
    ...managedResponse,
    events: remainingEvents,
  };

  return { managedResponse: cleanedManagedResponse, exceptionsFound };
}
