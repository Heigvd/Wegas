import { MethodConfig } from '../../../../editionConfig';

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
          type: 'string',
          value: 'popupEvent',
          const: 'popupEvent',
          view: {
            type: 'hidden',
          },
        },
        {
          type: 'object',
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
          type: 'string',
          required: true,
        },
      ],
    },
    'DelayedEvent.delayedFire': {
      label: 'Fire delayed event',
      parameters: [
        {
          type: 'number',
          required: true,
          view: { label: 'Minutes' },
        },
        {
          type: 'number',
          required: true,
          view: { label: 'Seconds' },
        },
        {
          type: 'string',
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
          type: 'string',
          required: true,
        },
      ],
    },
  },
};
