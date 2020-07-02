/**
 * This is not realy evolutive but let's hope we don't add new descriptor every weeks
 * Workaround : put all the methods in this file and make all the generated scripts point to this file
 */

import * as AbstractStateMachineDescriptor from './methods/AbstractStateMachineDescriptor';
import * as BooleanDescriptor from './methods/BooleanDescriptor';
import * as ChoiceDescriptor from './methods/ChoiceDescriptor';
import * as InboxDescriptor from './methods/InboxDescriptor';
import * as ListDescriptor from './methods/ListDescriptor';
import * as NumberDescriptor from './methods/NumberDescriptor';
import * as ObjectDescriptor from './methods/ObjectDescriptor';
import * as PeerReviewDescriptor from './methods/PeerReviewDescriptor';
import * as QuestionDescriptor from './methods/QuestionDescriptor';
import * as ResourceDescriptor from './methods/ResourceDescriptor';
import * as StringDescriptor from './methods/StringDescriptor';
import * as TaskDescriptor from './methods/TaskDescriptor';
import * as TextDescriptor from './methods/TextDescriptor';
import * as VariableDescriptor from './methods/VariableDescriptor';
import * as WhQuestionDescriptor from './methods/WhQuestionDescriptor';
import { IAbstractEntity } from 'wegas-ts-api/typings/WegasEntities';

export const methods: {
  [cls: string]: {
    [prop: string]: (entity: IAbstractEntity) => unknown;
  };
} = {
  AbstractStateMachineDescriptor,
  BooleanDescriptor,
  ChoiceDescriptor,
  InboxDescriptor,
  ListDescriptor,
  NumberDescriptor,
  ObjectDescriptor,
  PeerReviewDescriptor,
  QuestionDescriptor,
  ResourceDescriptor,
  StringDescriptor,
  TaskDescriptor,
  TextDescriptor,
  VariableDescriptor,
  WhQuestionDescriptor,
};
