import { VariableDescriptor } from '../selectors';
import { getInstance } from '../methods/VariableDescriptorMethods';
import { getValue as getStringValue } from './methods/StringDescriptor';

/**
 * INSTANCE METHODS HELPERS (should be moved somewhere else, like I...Instance.ts ???)
 */

export function getChoiceReplies(ci: IChoiceInstance, validated?: boolean) {
  if (validated) {
    return ci.replies.filter(r => r.validated);
  } else {
    return ci.replies;
  }
}

export function getQuestionReplies(
  qd: IQuestionDescriptor,
  validated?: boolean,
  self?: IPlayer,
) {
  let replies: IReply[] = [];
  VariableDescriptor.flatten<IChoiceDescriptor>(qd).map(cd => {
    const ci = getInstance(cd, self);
    if (ci) {
      replies = [...replies, ...getChoiceReplies(ci, validated)];
    }
  });
  return replies;
}

export function parseStringValues(sd: IStringDescriptor, self: IPlayer) {
  const json = getStringValue(sd)(self);
  if (json) {
    try {
      return JSON.parse(json) as string[];
    } catch (_e) {
      return [];
    }
  }
  return [];
}
