export const commonServerMethods: ServerGlobalObject = {
  RequestManager: {
    sendCustomEvent: {
      '@class': 'ServerGlobalMethod',
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
  },
  Event: {
    fire: {
      '@class': 'ServerGlobalMethod',
      label: 'Fire event',
      parameters: [
        {
          type: 'string',
          required: true,
        },
      ],
    },
    fired: {
      '@class': 'ServerGlobalMethod',
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
  DelayedEvent: {
    delayedFire: {
      '@class': 'ServerGlobalMethod',
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
};
