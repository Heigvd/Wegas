import { OverviewData } from './Overview';

export const test: OverviewData = {
  structure: [
    {
      id: 'monitoring',
      title: 'monitoring',
      items: [
        {
          id: '1007',
          order: 0,
          label: 'test string',
          active: true,
          sortable: true,
          kind: 'text',
        },
        {
          id: '1008',
          order: 1,
          label: 'modified variable',
          active: true,
          sortable: true,
          kind: 'number',
        },
      ],
    },
    {
      id: 'Actions',
      title: 'Actions',
      items: [
        {
          id: '1009',
          order: 0,
          itemType: 'action',
          label: 'Single impact',
          icon: 'ambulance',
          do:
            '{"type":"ModalAction","actions":[{"doFn":"function (team, payload) {\\n        Variable.find(gameModel, \\"number\\").add(self, payload.val1)\\n      }","schemaFn":"function () {\\n        return {\\n          description: \\"Modify variable number\\",\\n          properties: {\\n            val1: schemaProps.number({ label: \\"Add value\\", value: 0 })\\n          }\\n        }\\n      }"}]}',
        },
        {
          id: '1010',
          order: 1,
          itemType: 'action',
          label: 'Multiple impact',
          icon: 'pen',
          do:
            '{"type":"ModalAction","actions":[{"doFn":"function (team, payload) {\\n        Variable.find(gameModel, \\"number\\").add(self, payload.val1)\\n      }","schemaFn":"function () {\\n        return {\\n          description: \\"Modify variable number\\",\\n          properties: {\\n            val1: schemaProps.number({ label: \\"Add value\\" })\\n          }\\n        }\\n      }"},{"doFn":"function (team, payload) {\\n        Variable.find(gameModel, \\"number\\").setValue(self, payload.val1)\\n      }","schemaFn":"function () {\\n        return {\\n          description: \\"Modify variable number\\",\\n          properties: {\\n            val1: schemaProps.number({ label: \\"Set value\\" })\\n          }\\n        }\\n      }"}],"showAdvancedImpact":true}',
          hasGlobal: true,
        },
      ],
    },
  ],
  data: {
    '245189': {
      '1007': {
        title: 'Team Test team: test string',
        body: '',
        empty: true,
      },
      '1008': 23,
    },
    '245195': {
      '1007': {
        title: 'Team My team: test string',
        body: '<p>dasdawwdwd</p>',
        empty: false,
      },
      '1008': 111111,
    },
    '245200': {
      '1007': {
        title: 'Team Yeah: test string',
        body: '',
        empty: true,
      },
      '1008': 23,
    },
  },
};
