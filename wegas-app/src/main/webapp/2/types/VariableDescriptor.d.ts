interface IVariableDescriptor<T extends IVariableInstance = IVariableInstance>
  extends IWegasEntity,
    IVersionable {
  name: string;
  label: ITranslatableContent;
  editorTag: string | null;
  defaultInstance: T;
  scopeType: 'TeamScope' | 'GameModelScope' | 'PlayerScope';
  broadcastScope: | 'TeamScope' | 'GameScope' | 'PlayerScope';
  parentDescriptorId: number;
  parentDescriptorType: 'GameModel' | 'VariableDescriptor';
  comments: string | null;
}

interface IListDescriptor
  extends IVariableDescriptor<IListInstance>,
    IParentDescriptor {
  '@class': 'ListDescriptor';
  addShortcut: string;
  allowedTypes: string[];
}

interface INumberDescriptor extends IVariableDescriptor<INumberInstance> {
  '@class': 'NumberDescriptor';
  minValue: number | null;
  maxValue: number | null;
  historySize: number;
  /**
   * Server injected value
   * @deprecated
   */
  defaultValue: number;
}
interface IEnumItem extends IWegasEntity {
  label: ITranslatableContent;
  name: string;
}
interface ITextDescriptor extends IVariableDescriptor<ITextInstance> {
  '@class': 'TextDescriptor';
}
interface IStringDescriptor extends IVariableDescriptor<IStringInstance> {
  '@class': 'StringDescriptor';
  allowedValues: IEnumItem[];
  /**
   * Unused?
   */
  validationPattern?: string | null;
}
interface IQuestionDescriptor
  extends IVariableDescriptor<IQuestionInstance>,
    IParentDescriptor {
  '@class': 'QuestionDescriptor';
  description: null | ITranslatableContent;
  minReplies: null | number;
  maxReplies: null | number;
  cbx: boolean;
  pictures: string[];
  tabular: boolean;
}
interface IResult extends IWegasEntity, IVersionable {
  '@class': 'Result';
  answer: ITranslatableContent;
  choiceDescriptorId: number;
  files: string[];
  ignorationAnswer: ITranslatableContent;
  ignorationImpact: IScript;
  impact: IScript;
  label: ITranslatableContent;
  name: string;
}
interface IChoiceDescriptor extends IVariableDescriptor<IChoiceInstance> {
  '@class': 'ChoiceDescriptor';
  description: null | ITranslatableContent;
  cost: number;
  duration: number;
  results: IResult[];
  maxReplies: null | number;
}
interface ISingleResultChoiceDescriptor extends IChoiceDescriptor {
  results: [IResult];
}
interface IFSMDescriptor extends IVariableDescriptor<IFSMInstance> {
  '@class': 'FSMDescriptor';
  states: { [id: string]: IFSMDescriptor.State };
}
declare namespace IFSMDescriptor {
  export interface State extends IWegasEntity, IVersionable {
    '@class': 'State';
    editorPosition: Coordinate;
    label?: string | null;
    onEnterEvent?: IScript | null;
    stateMachineId?: number;
    transitions: Transition[];
  }
  export interface Transition extends IWegasEntity, IVersionable {
    '@class': 'Transition';
    nextStateId: number;
    triggerCondition?: IScript | null;
    preStateImpact?: IScript | null;
    stateId?: number;
    stateMachineId?: number;
    index?: number;
  }
  export interface Coordinate {
    '@class': 'Coordinate';
    x: number;
    y: number;
  }
}
