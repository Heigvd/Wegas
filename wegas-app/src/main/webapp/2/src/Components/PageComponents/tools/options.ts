// OPTIONS -> ACTIONS
import * as React from 'react';
import { store } from '../../../data/store';
import { ActionCreator } from '../../../data/actions';
import {
  clientScriptEval,
  useScript,
  useGlobals,
  safeClientScriptEval,
} from '../../Hooks/useScript';
import { fileURL, generateAbsolutePath } from '../../../API/files.api';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { wlog } from '../../../Helper/wegaslog';
import { findByName } from '../../../data/selectors/VariableDescriptorSelector';
import { HashListChoices } from '../../../Editor/Components/FormView/HashList';
import { schemaProps } from './schemaProps';
import { InfoBeamProps } from './InfoBeam';
import { flexlayoutChoices } from '../../Layouts/FlexList';
import { absolutelayoutChoices } from '../../Layouts/Absolute';
import { ContainerTypes } from './EditableComponent';
import { entityIs } from '../../../data/entities';
import { getQuestionReplies } from '../../../data/proxyfy/instancesHelpers';
import { createScript } from '../../../Helper/wegasEntites';
import { proxyfy } from '../../../data/proxyfy';

export interface WegasComponentOptionsAction {
  priority?: number;
}

interface OpenPageAction {
  pageLoaderName: IScript;
  pageId: IScript;
}
interface OpenURLAction {
  url: string;
}
interface OpenFileAction {
  fileDescriptor: IFileDescriptor;
}
interface ImpactVariableAction {
  impact: IScript;
}
interface LoaclScriptEvalAction {
  script: string;
}
interface OpenPopupPageAction {
  pageId: IScript;
}
interface PlaySoundAction {
  fileDescriptor: IFileDescriptor;
}
interface PrintVariableAction {
  variableName: string;
}

export interface WegasComponentOptionsActions {
  openPage?: OpenPageAction & WegasComponentOptionsAction;
  openUrl?: OpenURLAction & WegasComponentOptionsAction;
  openFile?: OpenFileAction & WegasComponentOptionsAction;
  impactVariable?: ImpactVariableAction & WegasComponentOptionsAction;
  localScriptEval?: LoaclScriptEvalAction & WegasComponentOptionsAction;
  openPopupPage?: OpenPopupPageAction & WegasComponentOptionsAction;
  playSound?: PlaySoundAction & WegasComponentOptionsAction;
  printVariable?: PrintVariableAction & WegasComponentOptionsAction;
}

export interface WegasComponentActionsProperties {
  confirmClick?: string;
  lock?: string;
}

export interface WegasComponentActions {
  openPage: (props: OpenPageAction) => void;
  openUrl: (props: OpenURLAction) => void;
  openFile: (props: OpenFileAction) => void;
  impactVariable: (props: ImpactVariableAction) => void;
  localScriptEval: (props: LoaclScriptEvalAction) => void;
  openPopupPage: (props: OpenPopupPageAction) => void;
  playSound: (props: PlaySoundAction) => void;
  printVariable: (props: PrintVariableAction) => void;
}

export const wegasComponentActions: WegasComponentActions = {
  openPage: ({ pageLoaderName, pageId }) => {
    store.dispatch(
      ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
        name: clientScriptEval<string>(pageLoaderName.content),
        pageId,
      }),
    );
  },
  openUrl: props => {
    window.open(props.url);
  },
  openFile: props => {
    const win = window.open(
      fileURL(generateAbsolutePath(props.fileDescriptor)),
      '_blank',
    );
    win!.focus();
  },
  impactVariable: props => {
    try {
      store.dispatch(runScript(props.impact, Player.selectCurrent()));
    } catch (error) {
      wlog(error);
    }
  },
  localScriptEval: props => {
    clientScriptEval(props.script);
  },
  openPopupPage: props => {
    //TODO : Discuss that with Maxence
    wlog('Need to implement a popup modal. Or is it allready here?');
    wlog(props);
  },
  playSound: props => {
    const audio = new Audio(
      fileURL(generateAbsolutePath(props.fileDescriptor)),
    );
    // We may register the sound component here and add another action for sound control (play, pause, volume, etc...)
    audio.play();
  },
  printVariable: props => {
    //TODO : Discuss that with Maxence
    wlog('Not implemented yet');
    wlog(findByName(props.variableName));
  },
};

const actionsChoices: HashListChoices = [
  {
    label: 'Open Page',
    value: {
      prop: 'openPage',
      schema: schemaProps.object('Open Page', {
        pageLoaderName: schemaProps.pageLoaderSelect('Page loader', true),
        pageId: schemaProps.pageSelect('Page', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Open Url',
    value: {
      prop: 'openUrl',
      schema: schemaProps.object('Open Url', {
        url: schemaProps.string('Url', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Open File',
    value: {
      prop: 'openFile',
      schema: schemaProps.object('Open File', {
        fileDescriptor: schemaProps.file('File', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Impact variable',
    value: {
      prop: 'impactVariable',
      schema: schemaProps.object('Impact variable', {
        impact: schemaProps.script('Impact', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Local script eval',
    value: {
      prop: 'localScriptEval',
      schema: schemaProps.object('Local script eval', {
        script: schemaProps.code('Local script', true, 'TypeScript'),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Open popup page',
    value: {
      prop: 'openPopupPage',
      schema: schemaProps.object('Open popup page', {
        pageId: schemaProps.pageSelect('Page', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Play sound',
    value: {
      prop: 'playSound',
      schema: schemaProps.object('Play sound', {
        fileDescriptor: schemaProps.file('File', true, 'FILE', {
          filterType: 'grey',
          fileType: 'audio',
        }),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Print variable',
    value: {
      prop: 'printVariable',
      schema: schemaProps.object('Print variable', {
        variableName: schemaProps.variable('Variable', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Confirm click',
    value: {
      prop: 'confirmClick',
      schema: schemaProps.string('Confirmation message', true, 'Are you sure?'),
    },
  },
  {
    label: 'Lock',
    value: {
      prop: 'lock',
      schema: schemaProps.string('Lock', true),
    },
  },
];

// OPTIONS -> UPGRADES
export interface WegasComponentUpgrades {
  tooltip?: string;
  infoBeam?: InfoBeamProps;
  unreadCount?: IScript;
  disableIf?: IScript;
}

const upgradeChoices: HashListChoices = [
  {
    label: 'Tooltip',
    value: {
      prop: 'tooltip',
      schema: schemaProps.string('Tooltip'),
    },
  },
  {
    label: 'Info Beam',
    value: {
      prop: 'infoBeam',
      schema: schemaProps.object('Info Beam', {
        showScript: schemaProps.script(
          'Show',
          false,
          'GET',
          'TypeScript',
          'true',
        ),
        blinkScript: schemaProps.script(
          'Blink',
          false,
          'GET',
          'TypeScript',
          'false',
        ),
        messageScript: schemaProps.customScript(
          'Message',
          false,
          ['string'],
          'TypeScript',
        ),
        // messageScript: schemaProps.code('Message', false, 'TypeScript'),
      }),
    },
  },
  {
    label: 'Unread count',
    value: {
      prop: 'unreadCount',
      schema: schemaProps.scriptVariable('Count in', true, [
        'number',
        'string',
        'object[]',
        'ISInboxDescriptor',
        'ISDialogueDescriptor',
        'ISQuestionDescriptor',
        'ISWhQuestionDescriptor',
        'ISSurveyDescriptor',
        'ISPeerReviewDescriptor',
      ]),
    },
  },
  {
    label: 'Disable If',
    value: {
      prop: 'disableIf',
      schema: schemaProps.script(
        'Disable If',
        false,
        'GET',
        'TypeScript',
        'false',
      ),
    },
  },
];

function extractUnreadCount(
  descriptor?:
    | IInboxDescriptor
    | IDialogueDescriptor
    | IQuestionDescriptor
    | IWhQuestionDescriptor
    | ISurveyDescriptor
    | IPeerReviewDescriptor,
): number {
  if (descriptor == null) {
    return 0;
  } else {
    const proxyfiedDescriptor = proxyfy(descriptor);
    const instance = proxyfiedDescriptor?.getInstance(Player.selectCurrent());
    if (instance == null) {
      return 0;
    } else {
      if (
        entityIs(descriptor, 'DialogueDescriptor') &&
        entityIs(instance, 'FSMInstance')
      ) {
        if (!instance.enabled) {
          return 0;
        } else {
          return descriptor.states[instance.currentStateId].transitions.length >
            0
            ? 1
            : 0;
        }
      }
      // const computedInstance = infobeamVD["@class"] === "DialogueDescriptor" ? infobeamVD.defaultInstance
      switch (instance['@class']) {
        case 'InboxInstance': {
          const nbUnread = instance.messages.filter(m => m.unread).length;
          if (nbUnread > 0) {
            return nbUnread;
          }
          return 0;
        }
        case 'QuestionInstance': {
          const questionDescriptor = descriptor as IQuestionDescriptor;
          if (questionDescriptor.cbx) {
            return instance.active && !instance.validated ? 1 : 0;
          } else {
            const replies = getQuestionReplies(questionDescriptor, true);
            return replies.length === 0 &&
              !instance.validated &&
              instance.active
              ? 1
              : 0;
          }
        }
        case 'WhQuestionInstance': {
          return instance.active && !instance.validated ? 1 : 0;
        }
        case 'SurveyInstance': {
          // TODO : Ask Jarle or Maxence here, as there is no validated props in SurveyInstance but it's still used in wegas-button.js : 212
          return instance.active /* && !instance.validated */ ? 1 : 0;
        }
        case 'PeerReviewInstance': {
          const types: ['toReview', 'reviewed'] = ['toReview', 'reviewed'];
          return types.reduce(
            (ot, t) =>
              ot +
              (instance[t] as IReview[]).reduce(
                (or, _r) =>
                  // TODO : Ask Maxence because r.reviewState is used in wegas-button.js : 212 but this prop seem to no exists on a Review
                  or +
                  ((t === 'toReview' &&
                    instance.reviewState === 'DISPATCHED') ||
                  (t === 'reviewed' && instance.reviewState === 'NOTIFIED')
                    ? 1
                    : 0),
                0,
              ),
            0,
          );
        }
        default:
          return 0;
      }
    }
  }
}

type UnreadCountDescriptorTypes =
  | IInboxDescriptor
  | IDialogueDescriptor
  | IQuestionDescriptor
  | IWhQuestionDescriptor
  | ISurveyDescriptor
  | IPeerReviewDescriptor;

export function useComputeUnreadCount(
  unreadCountVariableScript: IScript | undefined,
): InfoBeamProps | undefined {
  const scriptReturn = useScript<
    string | number | object[] | UnreadCountDescriptorTypes
  >(unreadCountVariableScript?.content || '');

  let infoBeamMessage: string | number;
  if (typeof scriptReturn === 'number') {
    infoBeamMessage = scriptReturn;
  } else if (typeof scriptReturn === 'string') {
    infoBeamMessage = scriptReturn;
  } else if (Array.isArray(scriptReturn)) {
    infoBeamMessage = scriptReturn.reduce(
      (o, v) => o + extractUnreadCount(v as UnreadCountDescriptorTypes),
      0,
    );
  } else {
    infoBeamMessage = extractUnreadCount(scriptReturn);
  }

  return infoBeamMessage
    ? {
        messageScript:
          infoBeamMessage === 0
            ? undefined
            : createScript(JSON.stringify(String(infoBeamMessage))),
      }
    : undefined;
}

const layoutChoices = {
  FLEX: [
    {
      label: 'Layout',
      value: { prop: 'layout' },
      items: flexlayoutChoices,
    },
  ],
  LINEAR: [],
  ABSOLUTE: [
    {
      label: 'Layout',
      value: { prop: 'layout' },
      items: absolutelayoutChoices,
    },
  ],
};

export const wegasComponentOptionsSchema = (containerType: ContainerTypes) => ({
  options: schemaProps.hashlist(
    'Options',
    false,
    [
      ...(containerType ? layoutChoices[containerType] : []),
      {
        label: 'Actions',
        value: { prop: 'actions' },
        items: actionsChoices,
      },
      {
        label: 'Upgrades',
        value: { prop: 'upgrades' },
        items: upgradeChoices,
      },
    ],
    undefined,
    undefined,
    1000,
    undefined,
    true,
  ),
});
