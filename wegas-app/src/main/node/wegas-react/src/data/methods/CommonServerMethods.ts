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
                label: 'Popup content',
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
          view: { label: 'Event name', type: 'eventSelector' },
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
          view: { label: 'Event name', type: 'eventSelector' },
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
          view: { label: 'Event name', type: 'eventSelector'},
        },
      ],
    },
  },
  /**
   * Test methods
   */
  // Test: {
  //   sendMail: {
  //     '@class': 'ServerGlobalMethod',
  //     label: 'Send mail',
  //     parameters: [
  //       {
  //         type: 'object',
  //         required: true,
  //         view: { label: 'To', type: 'i18nstring' },
  //       },
  //       {
  //         type: 'object',
  //         required: false,
  //         view: { label: 'Subject', type: 'i18nstring' },
  //       },
  //       {
  //         type: 'object',
  //         required: false,
  //         view: { label: 'MEssage', type: 'i18nhtml' },
  //       },
  //     ],
  //   },
  //   trad: {
  //     '@class': 'ServerGlobalMethod',
  //     label: 'Test trad',
  //     parameters: [
  //       {
  //         type: 'string',
  //         view: { label: 'String', type: 'string' },
  //       },
  //       {
  //         type: 'object',
  //         view: { label: 'I18n', type: 'i18nstring' },
  //       },
  //     ],
  //   },
  // },
};
