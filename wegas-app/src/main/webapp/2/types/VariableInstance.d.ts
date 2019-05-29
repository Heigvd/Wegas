interface IVariableInstance extends IWegasEntity, IVersionable {
  /**
   * Descriptor Id
   */
  descriptorId: number;
  /**
   * Player ID / Team ID / Game ID /
   * GameModel ID (0) hack / null for default Instances.
   */
  scopeKey: 0 | number | null;
}

interface INumberInstance extends IVariableInstance {
  '@class': 'NumberInstance';
  history: number[];
  value: number;
}
interface ITextInstance extends IVariableInstance {
  '@class': 'TextInstance';
  trValue: string | null;
}
interface IStringInstance extends IVariableInstance {
  '@class': 'StringInstance';
  trValue: string | null;
}
interface IListInstance extends IVariableInstance {
  '@class': 'ListInstance';
}
interface IQuestionInstance extends IVariableInstance {
  '@class': 'QuesionInstance';
  active: boolean;
  unread: boolean;
  validated: boolean;
}
interface IReply extends IWegasEntity {
  '@class': 'Reply';
  answer: ITranslatableContent;
  choiceName: string;
  createdTime: number;
  files: string[];
  ignorationAnswer: ITranslatableContent;
  ignored: boolean;
  resultName: string;
  startTime: number;
  unread: boolean;
}
interface IChoiceInstance extends IVariableInstance {
  '@class': 'ChoiceInstance';
  currentResultName: string | null;
  active: boolean;
  replies: IReply[];
  unread: boolean;
}
interface IFSMInstance extends IVariableInstance {
  '@class': 'FSMInstance';
  currentStateId: number;
  currentState: IFSMDescriptor.State;
  enabled: boolean;
  transitionHistory: number[];
}
