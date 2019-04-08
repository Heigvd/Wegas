import { store } from '../data/store';

type ContentType = 'application/json' | 'text/plain' ;

function COMMON_CONFIG(
  contentType?: ContentType,
  managed: boolean = false,
): RequestInit {
  const socket_id = store.getState().global.pusherStatus.socket_id;

  let HEADERS;
  if(contentType){
    HEADERS = new Headers({
      'Content-Type': contentType,
      'Managed-Mode': String(managed),
    });
  }
  else{
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
export interface ManagedMode {
  '@class': 'ManagedResponse';
  deletedEntities: IWegasEntity[];
  events: any[];
  updatedEntities: IWegasEntity[];
}
type View = 'Editor' | 'Instance' | 'Export';

export function rest(
  url: string,
  options: RequestInit = {},
  view?: View,
  contentType?: ContentType,
) {
  const v = view ? `${view}/` : '';
  const u = url.startsWith('/') ? url.substr(1) : url;
  return fetch(`${API_ENDPOINT}${v}${u}`, {
    ...COMMON_CONFIG(contentType),
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
  ).then(data => data.json() as Promise<ManagedMode>);
}
