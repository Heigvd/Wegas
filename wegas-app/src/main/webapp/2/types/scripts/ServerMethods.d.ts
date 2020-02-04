// Idealy, wenerate it
interface IRequestManager {
  sendCustomEvent: (
    type: 'popupEvent',
    payload: { timeout: number; content: string },
  ) => void;
}

interface IEvent {
  fire: (eventName: string) => void;
  fired: (eventName: string) => boolean;
}

interface IDelayedEvent {
  delayedFire: (minutes: number, second: number, eventName: string) => void;
}
