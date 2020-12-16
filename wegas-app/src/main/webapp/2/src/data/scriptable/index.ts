import { IMergeable, MapOf, SMergeable } from 'wegas-ts-api';
import * as WegasApiConnector from 'wegas-ts-api';

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

const apiConnector = new WegasApiConnector.WegasClient({
  BooleanDescriptor: SBooleanDescriptorImpl,
  BurndownDescriptor: SBurndownDescriptorImpl,
  ChoiceDescriptor: SChoiceDescriptorImpl,
  DialogueDescriptor: SDialogueDescriptorImpl,
  FSMDescriptor: SFSMDescriptorImpl,
  InboxDescriptor: SInboxDescriptorImpl,
  ListDescriptor: SListDescriptorImpl,
  NumberDescriptor: SNumberDescriptorImpl,
  ObjectDescriptor: SObjectDescriptorImpl,
  PeerReviewDescriptor: SPeerReviewDescriptorImpl,
  ResourceDescriptor: SResourceDescriptorImpl,
  SingleResultChoiceDescriptor: SSingleResultChoiceDescriptorImpl,
  StaticTextDescriptor: SStaticTextDescriptorImpl,
  StringDescriptor: SStringDescriptorImpl,
  SurveyDescriptor: SSurveyDescriptorImpl,
  TaskDescriptor: STaskDescriptorImpl,
  TextDescriptor: STextDescriptorImpl,
  TriggerDescriptor: STriggerDescriptorImpl,
  WhQuestionDescriptor: SWhQuestionDescriptorImpl,
  QuestionDescriptor: SQuestionDescriptorImpl,
  SurveySectionDescriptor: SSurveySectionDescriptorImpl,
  SurveyChoicesDescriptor: SSurveyChoicesDescriptorImpl,
  SurveyTextDescriptor: SSurveyTextDescriptorImpl,
  SurveyNumberDescriptor: SSurveyNumberDescriptorImpl,
});

export function instantiate<
  T extends IMergeable | IMergeable[] | MapOf<IMergeable> | null | undefined
>(entity: T) {
  return apiConnector.instantiate(entity);
}

export function isNotScriptable(
  variable: IMergeable | SMergeable,
): variable is IMergeable {
  return '@class' in variable;
}
