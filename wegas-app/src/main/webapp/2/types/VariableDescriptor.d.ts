interface IScope {
  '@class': 'TeamScope' | 'GameModelScope' | 'GameScope' | 'PlayerScope';
  broadcastScope: 'TeamScope' | 'GameModelScope' | 'GameScope' | 'PlayerScope';
}
interface IVariableDescriptor<T extends IVariableInstance = IVariableInstance>
  extends IWegasEntity,
    IVersionable {
  name: string;
  label: string;
  title: string | null;
  defaultInstance: T;
  scope: IScope;
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
}

interface ITextDescriptor extends IVariableDescriptor<ITextInstance> {
  '@class': 'TextDescriptor';
}
interface IStringDescriptor extends IVariableDescriptor<IStringInstance> {
  '@class': 'StringDescriptor';
  allowedValues: string[];
}
interface IQuestionDescriptor
  extends IVariableDescriptor<IQuestionInstance>,
    IParentDescriptor {
  '@class': 'QuestionDescriptor';
  description: null | string;
  minReplies: null | number;
  maxReplies: null | number;
  cbx: boolean;
  pictures: string[];
  tabular: boolean;
}
interface IResult extends IWegasEntity, IVersionable {
  '@class': 'Result';
  answer: string;
  choiceDescriptorId: number;
  files: string[];
  ignorationAnswer: string;
  ignorationImpact: IScript;
  impact: IScript;
  label: string;
  name: string;
}
interface IChoiceDescriptor extends IVariableDescriptor<IChoiceInstance> {
  '@class': 'ChoiceDescriptor';
  description: null | string;
  cost: number;
  duration: number;
  results: IResult[];
  maxReplies: null | number;
}
interface ISingleResultChoiceDescriptor extends IChoiceDescriptor {
  results: [IResult];
}
