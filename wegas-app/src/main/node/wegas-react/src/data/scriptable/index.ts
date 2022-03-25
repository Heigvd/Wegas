import { IMergeable, MapOf } from 'wegas-ts-api';
import * as WegasApiConnector from 'wegas-ts-api';

import { SAchievementDescriptorImpl } from './impl/AchievementDescriptor';
import { SBooleanDescriptorImpl } from './impl/BooleanDescriptor';
import { SNumberDescriptorImpl } from './impl/NumberDescriptor';
import { SWhQuestionDescriptorImpl } from './impl/WhQuestionDescriptor';
import { STextDescriptorImpl } from './impl/TextDescriptor';
import { SStringDescriptorImpl } from './impl/StringDescriptor';
import { STaskDescriptorImpl } from './impl/TaskDescriptor';
import { SResourceDescriptorImpl } from './impl/ResourceDescriptor';
import { SObjectDescriptorImpl } from './impl/ObjectDescriptor';
import { SInboxDescriptorImpl } from './impl/InboxDescriptor';
import { SBurndownDescriptorImpl } from './impl/BurndownDescriptor';
import { SListDescriptorImpl } from './impl/ListDescriptor';
import { SQuestionDescriptorImpl } from './impl/QuestionDescriptor';
import {
  SChoiceDescriptorImpl,
  SSingleResultChoiceDescriptorImpl,
} from './impl/ChoiceDescriptor';
import {
  SFSMDescriptorImpl,
  STriggerDescriptorImpl,
  SDialogueDescriptorImpl,
} from './impl/SFSMDescriptor';
import { SStaticTextDescriptorImpl } from './impl/StaticTextDescriptor';
import { SPeerReviewDescriptorImpl } from './impl/PeerReviewDescriptor';
import { SSurveyDescriptorImpl } from './impl/SurveyDescriptor';
import { SSurveySectionDescriptorImpl } from './impl/SurveySectionDescriptor';
import {
  SSurveyChoicesDescriptorImpl,
  SSurveyTextDescriptorImpl,
  SSurveyNumberDescriptorImpl,
} from './impl/SurveyInputDescriptor';

const factory: WegasApiConnector.ConcretableFactory = {
  AchievementDescriptor: (c, e) => new SAchievementDescriptorImpl(c, e),
  BooleanDescriptor: (c, e) => new SBooleanDescriptorImpl(c, e),
  BurndownDescriptor: (c, e) => new SBurndownDescriptorImpl(c, e),
  ChoiceDescriptor: (c, e) => new SChoiceDescriptorImpl(c, e),
  DialogueDescriptor: (c, e) => new SDialogueDescriptorImpl(c, e),
  FSMDescriptor: (c, e) => new SFSMDescriptorImpl(c, e),
  InboxDescriptor: (c, e) => new SInboxDescriptorImpl(c, e),
  ListDescriptor: (c, e) => new SListDescriptorImpl(c, e),
  NumberDescriptor: (c, e) => new SNumberDescriptorImpl(c, e),
  ObjectDescriptor: (c, e) => new SObjectDescriptorImpl(c, e),
  PeerReviewDescriptor: (c, e) => new SPeerReviewDescriptorImpl(c, e),
  ResourceDescriptor: (c, e) => new SResourceDescriptorImpl(c, e),
  SingleResultChoiceDescriptor: (c, e) =>
    new SSingleResultChoiceDescriptorImpl(c, e),
  StaticTextDescriptor: (c, e) => new SStaticTextDescriptorImpl(c, e),
  StringDescriptor: (c, e) => new SStringDescriptorImpl(c, e),
  SurveyDescriptor: (c, e) => new SSurveyDescriptorImpl(c, e),
  TaskDescriptor: (c, e) => new STaskDescriptorImpl(c, e),
  TextDescriptor: (c, e) => new STextDescriptorImpl(c, e),
  TriggerDescriptor: (c, e) => new STriggerDescriptorImpl(c, e),
  WhQuestionDescriptor: (c, e) => new SWhQuestionDescriptorImpl(c, e),
  QuestionDescriptor: (c, e) => new SQuestionDescriptorImpl(c, e),
  SurveySectionDescriptor: (c, e) => new SSurveySectionDescriptorImpl(c, e),
  SurveyChoicesDescriptor: (c, e) => new SSurveyChoicesDescriptorImpl(c, e),
  SurveyTextDescriptor: (c, e) => new SSurveyTextDescriptorImpl(c, e),
  SurveyNumberDescriptor: (c, e) => new SSurveyNumberDescriptorImpl(c, e),
};

const apiConnector = new WegasApiConnector.WegasClient(factory);

export function instantiate<
  T extends IMergeable | IMergeable[] | MapOf<IMergeable> | null | undefined,
>(entity: T) {
  return apiConnector.instantiate(entity);
}
