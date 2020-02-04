import { MethodConfig } from '../../../editionConfig';

interface ScriptStore {
  impact: MethodConfig;
  condition: MethodConfig;
}
export const SCRIPTS: ScriptStore = {
  impact: {
    'RequestManager.sendCustomEvent': {
      label: 'Send popup',
      parameters: [
        {
          type: 'string' as 'string',
          value: 'popupEvent',
          const: 'popupEvent',
          view: {
            type: 'hidden',
          },
        },
        {
          type: 'object' as 'object',
          properties: {
            content: {
              type: 'string',
              view: {
                type: 'html',
              },
            },
          },
        },
      ],
    },
    'Event.fire': {
      label: 'Fire event',
      parameters: [
        {
          type: 'string' as 'string',
          required: true,
        },
      ],
    },
    'DelayedEvent.delayedFire': {
      label: 'Fire delayed event',
      parameters: [
        {
          type: 'number' as 'number',
          required: true,
          view: { label: 'Minutes' },
        },
        {
          type: 'number' as 'number',
          required: true,
          view: { label: 'Seconds' },
        },
        {
          type: 'string' as 'string',
          required: true,
          view: { label: 'Event name' },
        },
      ],
    },
  },
  condition: {
    'Event.fired': {
      returns: 'boolean',
      label: 'Event has been fired',
      parameters: [
        {
          type: 'string' as 'string',
          required: true,
        },
      ],
    },
  },
};

export function getGlobalMethodConfig(
  globalMethod: string,
  isCondition: boolean,
) {
  return SCRIPTS[isCondition ? 'condition' : 'impact'][globalMethod];
}
