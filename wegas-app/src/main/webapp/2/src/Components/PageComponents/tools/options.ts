// OPTIONS -> ACTIONS
import { store } from '../../../data/store';
import { ActionCreator } from '../../../data/actions';
import { clientScriptEval, useScript } from '../../Hooks/useScript';
import { fileURL } from '../../../API/files.api';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { wlog } from '../../../Helper/wegaslog';
import { findByName } from '../../../data/selectors/VariableDescriptorSelector';
import { HashListChoices } from '../../../Editor/Components/FormView/HashList';
import { schemaProps } from './schemaProps';
import { PlayerInfoBulletProps } from './InfoBullet';
import { flexItemChoices } from '../../Layouts/FlexList';
import { absoluteItemChoices } from '../../Layouts/Absolute';
import { ContainerTypes } from './EditableComponent';
import { createScript } from '../../../Helper/wegasEntites';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
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
} from 'wegas-ts-api/src/generated/WegasScriptableEntities';
import { menuItemChoices } from '../../Layouts/Menu';

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
  filePath: string;
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
  localScriptEval?: LoaclScriptEvalAction & WegasComponentOptionsAction;
  openPopupPage?: OpenPopupPageAction & WegasComponentOptionsAction;
  playSound?: PlaySoundAction & WegasComponentOptionsAction;
  printVariable?: PrintVariableAction & WegasComponentOptionsAction;
}

const defaultWegasComponentOptionsActions: WegasComponentOptionsActions = {
  impactVariable: undefined,
  localScriptEval: undefined,
  openFile: undefined,
  openPage: undefined,
  openPopupPage: undefined,
  openUrl: undefined,
  playSound: undefined,
  printVariable: undefined,
};

export const defaultWegasComponentOptionsActionsKeys = Object.keys(
  defaultWegasComponentOptionsActions,
);

export interface WegasComponentOptionsActionsProperties {
  confirmClick?: string;
}

const defaulWegasComponentOptionsActionsProperties: WegasComponentOptionsActionsProperties = {
  confirmClick: undefined,
};

const defaultWegasComponentOptionsActionsPropertiesKeys = Object.keys(
  defaulWegasComponentOptionsActionsProperties,
);

export const defaultWegasComponentActionsKeys = [
  ...defaultWegasComponentOptionsActionsKeys,
  ...defaultWegasComponentOptionsActionsPropertiesKeys,
];

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
    const name = clientScriptEval<string>(pageLoaderName.content);
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
    const win = window.open(fileURL(props.filePath), '_blank');
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
      schema: schemaProps.object(
        'Open Page',
        {
          pageLoaderName: schemaProps.pageLoaderSelect('Page loader', true),
          pageId: schemaProps.pageSelect('Page', true),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Open Url',
    value: {
      prop: 'openUrl',
      schema: schemaProps.object(
        'Open Url',
        {
          url: schemaProps.string('Url', true),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Open File',
    value: {
      prop: 'openFile',
      schema: schemaProps.object(
        'Open File',
        {
          fileDescriptor: schemaProps.path('File', true),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Impact variable',
    value: {
      prop: 'impactVariable',
      schema: schemaProps.object(
        'Impact variable',
        {
          impact: schemaProps.script('Impact', true),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Local script eval',
    value: {
      prop: 'localScriptEval',
      schema: schemaProps.object(
        'Local script eval',
        {
          script: schemaProps.code('Local script', true, 'TypeScript'),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Open popup page',
    value: {
      prop: 'openPopupPage',
      schema: schemaProps.object(
        'Open popup page',
        {
          pageId: schemaProps.pageSelect('Page', true),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Play sound',
    value: {
      prop: 'playSound',
      schema: schemaProps.object(
        'Play sound',
        {
          fileDescriptor: schemaProps.path('File', true, 'FILE', {
            filterType: 'grey',
            fileType: 'audio',
          }),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Print variable',
    value: {
      prop: 'printVariable',
      schema: schemaProps.object(
        'Print variable',
        {
          variableName: schemaProps.variable('Variable', true),
          priority: schemaProps.number('Priority', false),
        },
        false,
      ),
    },
  },
  {
    label: 'Confirm click',
    value: {
      prop: 'confirmClick',
      schema: schemaProps.string(
        'Confirmation message',
        false,
        'Are you sure?',
      ),
    },
  },
];

// OPTIONS -> LAYOUT COMMON
export interface WegasComponentLayoutCommonOptions {
  tooltip?: string;
  themeMode?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

export const layoutCommonChoices: HashListChoices = [
  {
    label: 'Tooltip',
    value: {
      prop: 'tooltip',
      schema: schemaProps.string('Tooltip', false),
    },
  },
  {
    label: 'Theme mode',
    value: {
      prop: 'themeMode',
      schema: schemaProps.themeModeSelect('Theme mode', false),
    },
  },
  {
    label: 'Style',
    value: {
      prop: 'style',
      schema: schemaProps.hashlist('Style', false),
    },
  },
  {
    label: 'Container style',
    value: {
      prop: 'containerStyle',
      schema: schemaProps.hashlist('Container style', false),
    },
  },
];

// OPTIONS -> LAYOUT CONDITIONNAL
export interface WegasComponentLayoutConditionnalOptions {
  disableIf?: IScript;
  hideIf?: IScript;
  readOnlyIf?: IScript;
  lock?: string;
}

export const layoutConditionnalChoices: HashListChoices = [
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
  {
    label: 'Hide If',
    value: {
      prop: 'hideIf',
      schema: schemaProps.script(
        'Hide If',
        false,
        'GET',
        'TypeScript',
        'false',
      ),
    },
  },
  {
    label: 'Readonly If',
    value: {
      prop: 'readOnlyIf',
      schema: schemaProps.script(
        'Readonly If',
        false,
        'GET',
        'TypeScript',
        'false',
      ),
    },
  },
  {
    label: 'Lock',
    value: {
      prop: 'lock',
      schema: schemaProps.string('Lock', false),
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
      schema: schemaProps.object(
        'Info Bullet',
        {
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
        },
        false,
      ),
    },
  },
  {
    label: 'Unread count',
    value: {
      prop: 'unreadCount',
      schema: schemaProps.scriptVariable('Count in', false, [
        'number',
        'string',
        'object[]',
        'SInboxDescriptor',
        'SDialogueDescriptor',
        'SQuestionDescriptor',
        'SWhQuestionDescriptor',
        'SSurveyDescriptor',
        'SPeerReviewDescriptor',
      ]),
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
  >(unreadCountVariableScript?.content);

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

export const layoutChoices = {
  FLEX: flexItemChoices,
  LINEAR: [],
  ABSOLUTE: absoluteItemChoices,
  MENU: menuItemChoices,
};

export const wegasComponentExtraSchema = (containerType: ContainerTypes) => ({
  layoutOptions: schemaProps.hashlist(
    'Layout options',
    false,
    [
      ...(containerType ? layoutChoices[containerType] : []),
      ...layoutCommonChoices,
    ],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  ),
  layoutConditions: schemaProps.hashlist(
    'Layout conditions',
    false,
    layoutConditionnalChoices,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  ),
  actions: schemaProps.hashlist(
    'OnClick Actions',
    false,
    actionsChoices,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  ),
  decorations: schemaProps.hashlist(
    'Decorations',
    false,
    decorationsChoices,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  ),
});
