// OPTIONS -> ACTIONS
import { store } from '../../../data/Stores/store';
import { ActionCreator } from '../../../data/actions';
import { clientScriptEval, useScript } from '../../Hooks/useScript';
import { fileURL } from '../../../API/files.api';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { wlog, wwarn } from '../../../Helper/wegaslog';
import { findByName } from '../../../data/selectors/VariableDescriptorSelector';
import { HashListChoices } from '../../../Editor/Components/FormView/HashList';
import { schemaProps } from './schemaProps';
import { PlayerInfoBulletProps } from './InfoBullet';
import { createScript } from '../../../Helper/wegasEntites';
import { IScript } from 'wegas-ts-api';
import { instantiate } from '../../../data/scriptable';
import {
  SDialogueDescriptor,
  SFSMInstance,
  SInboxInstance,
  SQuestionInstance,
  SQuestionDescriptor,
  SWhQuestionInstance,
  SSurveyInstance,
  SPeerReviewInstance,
  SInboxDescriptor,
  SWhQuestionDescriptor,
  SSurveyDescriptor,
  SPeerReviewDescriptor,
} from 'wegas-ts-api';

export interface PageComponentContext {
  [item: string]: unknown;
}

export interface WegasComponentOptionsAction {
  priority?: number;
}

export interface OpenPageAction {
  pageLoaderName: IScript;
  pageId: IScript;
  context?: PageComponentContext;
}
interface OpenURLAction {
  url: string;
}
interface OpenFileAction {
  filePath: IScript;
  context?: PageComponentContext;
}
interface ImpactVariableAction {
  impact: IScript;
}
interface LocalScriptEvalAction {
  script: IScript;
  context?: PageComponentContext;
}
interface OpenPopupPageAction {
  pageId: IScript;
  context?: PageComponentContext;
}
interface PlaySoundAction {
  filePath: string;
}
interface PrintVariableAction {
  variableName: string;
}

export interface WegasComponentOptionsActions {
  openPage?: OpenPageAction & WegasComponentOptionsAction;
  openUrl?: OpenURLAction & WegasComponentOptionsAction;
  openFile?: OpenFileAction & WegasComponentOptionsAction;
  impactVariable?: ImpactVariableAction & WegasComponentOptionsAction;
  localScriptEval?: LocalScriptEvalAction & WegasComponentOptionsAction;
  openPopupPage?: OpenPopupPageAction & WegasComponentOptionsAction;
  playSound?: PlaySoundAction & WegasComponentOptionsAction;
  printVariable?: PrintVariableAction & WegasComponentOptionsAction;
}

export const defaultWegasComponentOptionsActions: WegasComponentOptionsActions = {
  impactVariable: undefined,
  localScriptEval: undefined,
  openFile: undefined,
  openPage: undefined,
  openPopupPage: undefined,
  openUrl: undefined,
  playSound: undefined,
  printVariable: undefined,
};

export interface WegasComponentActionsProperties {
  confirmClick?: string;
  stopPropagation?: boolean;
}

export interface WegasComponentActions {
  openPage: (props: OpenPageAction) => void;
  openUrl: (props: OpenURLAction) => void;
  openFile: (props: OpenFileAction) => void;
  impactVariable: (props: ImpactVariableAction) => void;
  localScriptEval: (props: LocalScriptEvalAction) => void;
  openPopupPage: (props: OpenPopupPageAction) => void;
  playSound: (props: PlaySoundAction) => void;
  printVariable: (props: PrintVariableAction) => void;
}

export const wegasComponentActions: WegasComponentActions = {
  openPage: ({ pageLoaderName, pageId, context }) => {
    const name = clientScriptEval<string>(pageLoaderName.content, context);
    if (name != null) {
      store.dispatch(
        ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
          name,
          pageId,
        }),
      );
    }
  },
  openUrl: props => {
    window.open(props.url);
  },
  openFile: props => {
    const win = window.open(
      fileURL(clientScriptEval(props.filePath, props.context)),
      '_blank',
    );
    win!.focus();
  },
  impactVariable: props => {
    try {
      store.dispatch(runScript(props.impact, Player.selectCurrent()));
    } catch (error) {
      wwarn(error);
    }
  },
  localScriptEval: props => {
    clientScriptEval(props.script, props.context);
  },
  openPopupPage: props => {
    //TODO : Discuss that with Maxence
    wlog('Need to implement a popup modal. Or is it allready here?');
    wlog(props);
  },
  playSound: props => {
    const audio = new Audio(fileURL(props.filePath));
    // We may register the sound component here and add another action for sound control (play, pause, volume, etc...)
    audio.play();
  },
  printVariable: props => {
    //TODO : Discuss that with Maxence
    wlog('Not implemented yet');
    wlog(findByName(props.variableName));
  },
};

export const actionsChoices: HashListChoices = [
  {
    label: 'Open Page',
    value: {
      prop: 'openPage',
      schema: schemaProps.object({
        label: 'Open Page',
        properties: {
          pageLoaderName: schemaProps.pageLoaderSelect({
            label: 'Page loader',
            required: true,
          }),
          pageId: schemaProps.pageSelect({ label: 'Page', required: true }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Open Url',
    value: {
      prop: 'openUrl',
      schema: schemaProps.object({
        label: 'Open Url',
        properties: {
          url: schemaProps.string({ label: 'Url', required: true }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Open File',
    value: {
      prop: 'openFile',
      schema: schemaProps.object({
        label: 'Open File',
        properties: {
          filePath: schemaProps.path({
            label: 'File',
            required: true,
            scriptable: true,
          }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Impact variable',
    value: {
      prop: 'impactVariable',
      schema: schemaProps.object({
        label: 'Impact variable',
        properties: {
          impact: schemaProps.script({ label: 'Impact', required: true }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Local script eval',
    value: {
      prop: 'localScriptEval',
      schema: schemaProps.object({
        label: 'Local script eval',
        properties: {
          script: schemaProps.code({
            label: 'Local script',
            required: true,
            language: 'TypeScript',
          }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Open popup page',
    value: {
      prop: 'openPopupPage',
      schema: schemaProps.object({
        label: 'Open popup page',
        properties: {
          pageId: schemaProps.pageSelect({ label: 'Page', required: true }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Play sound',
    value: {
      prop: 'playSound',
      schema: schemaProps.object({
        label: 'Play sound',
        properties: {
          fileDescriptor: schemaProps.path({
            label: 'File',
            required: true,
            pickType: 'FILE',
            filter: {
              filterType: 'grey',
              fileType: 'audio',
            },
          }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Print variable',
    value: {
      prop: 'printVariable',
      schema: schemaProps.object({
        label: 'Print variable',
        properties: {
          variableName: schemaProps.variable({
            label: 'Variable',
            required: true,
          }),
          priority: schemaProps.number({ label: 'Priority' }),
        },
      }),
    },
  },
  {
    label: 'Confirm click',
    value: {
      prop: 'confirmClick',
      schema: schemaProps.string({
        label: 'Confirmation message',
        value: 'Are you sure?',
      }),
    },
  },
  {
    label: 'Stop propagation',
    value: {
      prop: 'stopPropagation',
      schema: schemaProps.boolean({
        label: 'Stop propagation',
        value: false,
      }),
    },
  },
];

// OPTIONS -> LAYOUT COMMON
export interface WegasComponentLayoutCommonOptions {
  tooltip?: string;
  themeMode?: string;
}

export const layoutCommonChoices: HashListChoices = [
  {
    label: 'Tooltip',
    value: {
      prop: 'tooltip',
      schema: schemaProps.string({ label: 'Tooltip' }),
    },
  },
  {
    label: 'Theme mode',
    value: {
      prop: 'themeMode',
      schema: schemaProps.themeModeSelect({ label: 'Theme mode' }),
    },
  },
];

export interface WegasConditionnalClassName {
  className?: string;
  applyOn?: 'Inside' | 'Outside';
  condition?: IScript;
}

// OPTIONS -> LAYOUT CONDITIONNAL
export interface WegasComponentLayoutConditionnalOptions {
  conditionnalClassNames?: WegasConditionnalClassName[];
  disableIf?: IScript;
  hideIf?: IScript;
  readOnlyIf?: IScript;
  lock?: string;
}

export const layoutConditionnalChoices: HashListChoices = [
  {
    label: 'Conditionnal classes',
    value: {
      prop: 'conditionnalClassNames',
      schema: schemaProps.array({
        label: 'Conditionnal classes',
        itemSchema: {
          className: schemaProps.string({ label: 'Class' }),
          applyOn: schemaProps.select({
            label: 'Apply on',
            values: ['Inside', 'Outside'],
            value: 'Inside',
          }),
          condition: schemaProps.script({
            label: 'Condition',
            mode: 'GET',
            language: 'TypeScript',
            value: 'false',
          }),
        },
      }),
    },
  },
  {
    label: 'Disable If',
    value: {
      prop: 'disableIf',
      schema: schemaProps.script({
        label: 'Disable If',
        mode: 'GET',
        language: 'TypeScript',
        value: 'false',
      }),
    },
  },
  {
    label: 'Hide If',
    value: {
      prop: 'hideIf',
      schema: schemaProps.script({
        label: 'Hide If',
        mode: 'GET',
        language: 'TypeScript',
        value: 'false',
      }),
    },
  },
  {
    label: 'Readonly If',
    value: {
      prop: 'readOnlyIf',
      schema: schemaProps.script({
        label: 'Readonly If',
        mode: 'GET',
        language: 'TypeScript',
        value: 'false',
      }),
    },
  },
  {
    label: 'Lock',
    value: {
      prop: 'lock',
      schema: schemaProps.string({ label: 'Lock' }),
    },
  },
];

// OPTIONS -> DECORATIONS
export interface WegasComponentDecorations {
  infoBullet?: PlayerInfoBulletProps;
  unreadCount?: IScript;
}

export const decorationsChoices: HashListChoices = [
  {
    label: 'Info Bullet',
    value: {
      prop: 'infoBullet',
      schema: schemaProps.object({
        label: 'Info Bullet',
        properties: {
          showScript: schemaProps.script({
            label: 'Show',
            mode: 'GET',
            language: 'TypeScript',
            value: 'true',
          }),
          blinkScript: schemaProps.script({
            label: 'Blink',
            mode: 'GET',
            language: 'TypeScript',
            value: 'false',
          }),
          messageScript: schemaProps.customScript({
            label: 'Message',
            returnType: ['string'],
            language: 'TypeScript',
          }),
          // messageScript: schemaProps.code('Message', false, 'TypeScript'),
        },
      }),
    },
  },
  {
    label: 'Unread count',
    value: {
      prop: 'unreadCount',
      schema: schemaProps.scriptVariable({
        label: 'Count in',
        returnType: [
          'number',
          'string',
          'object[]',
          'SInboxDescriptor',
          'SDialogueDescriptor',
          'SQuestionDescriptor',
          'SWhQuestionDescriptor',
          'SSurveyDescriptor',
          'SPeerReviewDescriptor',
        ],
      }),
    },
  },
];

type UnreadCountDescriptorTypes =
  | SInboxDescriptor
  | SDialogueDescriptor
  | SQuestionDescriptor
  | SWhQuestionDescriptor
  | SSurveyDescriptor
  | SPeerReviewDescriptor;

function extractUnreadCount(descriptor?: UnreadCountDescriptorTypes): number {
  if (!descriptor) {
    return 0;
  } else {
    const self = instantiate(Player.selectCurrent());
    const instance = descriptor?.getInstance(self);

    if (!instance) {
      return 0;
    } else {
      if (
        descriptor instanceof SDialogueDescriptor &&
        instance instanceof SFSMInstance
      ) {
        if (
          instance.getEnabled() &&
          descriptor.getStates()[instance.getCurrentStateId()].getTransitions()
            .length > 0
        ) {
          return 1;
        } else {
          return 0;
        }
      } else if (instance instanceof SInboxInstance) {
        return instance.getMessages().filter(m => m.getUnread()).length;
      } else if (
        descriptor instanceof SQuestionDescriptor &&
        instance instanceof SQuestionInstance
      ) {
        if (instance.isValidated() || !instance.getActive()) {
          return 0;
        } else {
          if (descriptor.getCbx()) {
            // active and not validated cbx always return 1
            return 1;
          } else {
            // non-cbx must have 0 reply
            return descriptor.isReplied(self) ? 0 : 1;
          }
        }
      } else if (instance instanceof SWhQuestionInstance) {
        return instance.getActive && !instance.isValidated() ? 1 : 0;
      } else if (instance instanceof SSurveyInstance) {
        return instance.getActive() &&
          (instance.getStatus() === 'REQUESTED' ||
            instance.getStatus() === 'ONGOING')
          ? 1
          : 0;
      } else if (instance instanceof SPeerReviewInstance) {
        return instance
          .getToReview()
          .filter(review => review.getReviewState() == 'DISPATCHED')
          .concat(
            instance
              .getReviewed()
              .filter(review => review.getReviewState() == 'NOTIFIED'),
          ).length;
      } else {
        return 0;
      }
    }
  }
}

export function useComputeUnreadCount(
  unreadCountVariableScript: IScript | undefined,
): PlayerInfoBulletProps | undefined {
  const scriptReturn = useScript<
    string | number | object[] | UnreadCountDescriptorTypes
  >(unreadCountVariableScript);

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

export type WegasComponentExtra = WegasComponentLayoutCommonOptions &
  WegasComponentLayoutConditionnalOptions &
  WegasComponentDecorations;

// export const layoutChoices = {
//   FLEX: flexlayoutChoices,
//   LINEAR: [],
//   ABSOLUTE: absolutelayoutChoices,
//   MENU: menuItemSchema,
//   FOREACH: flexlayoutChoices,
// };

export const wegasComponentExtraSchema = (
  childrenSchema: HashListChoices = [],
) => ({
  layoutOptions: schemaProps.hashlist({
    label: 'Layout options',
    choices: [...childrenSchema, ...layoutCommonChoices],
    objectViewStyle: true,
  }),
  layoutConditions: schemaProps.hashlist({
    label: 'Layout conditions',
    choices: layoutConditionnalChoices,
    objectViewStyle: true,
  }),
  actions: schemaProps.hashlist({
    label: 'OnClick Actions',
    choices: actionsChoices,
    objectViewStyle: true,
  }),
  decorations: schemaProps.hashlist({
    label: 'Decorations',
    choices: decorationsChoices,
    objectViewStyle: true,
  }),
});

/**
 * classAndStyleShema - defines the schema to be used to edit classes and style of a component
 */
export const classStyleIdShema = {
  className: schemaProps.string({ label: 'Classes' }),
  style: schemaProps.hashlist({ label: 'Style' }),
  id: schemaProps.string({ label: 'Id' }),
};

export const clientAndServerScriptChoices: HashListChoices = [
  {
    label: 'Client script',
    value: {
      prop: 'client',
      schema: schemaProps.customScript({
        label: 'Client script',
        required: true,
        language: 'TypeScript',
      }),
    },
  },
  {
    label: 'Server script',
    value: {
      prop: 'server',
      schema: schemaProps.script({
        label: 'Server script',
        required: true,
        mode: 'SET',
        language: 'TypeScript',
      }),
    },
  },
];
