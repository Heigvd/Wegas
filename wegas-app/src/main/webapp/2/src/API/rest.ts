import { store } from '../data/store';

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
export interface IManagedResponse {
  '@class': 'ManagedResponse';
  deletedEntities: IAbstractEntity[];
  updatedEntities: IAbstractEntity[];
  events: any[];
}
type View = 'Editor' | 'Instance' | 'Export';

export function rest(
  url: string,
  options: RequestInit = {},
  view?: View,
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
  const u = url.startsWith('/') ? url.substr(1) : url;
  return fetch(`${API_ENDPOINT}${v}${u}`, {
    ...COMMON_CONFIG(type),
    ...options,
  }).then(res => {
    if (res.ok) {
      return res;
    }
    throw res;
  });
  // const oReq = new XMLHttpRequest();
  // oReq.open(options.method ? options.method : 'GET', `${API_ENDPOINT}${v}${u}`);
  // oReq.send();
}
export function managedModeRequest(
  url: string,
  options: RequestInit = {},
  view?: View,
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
