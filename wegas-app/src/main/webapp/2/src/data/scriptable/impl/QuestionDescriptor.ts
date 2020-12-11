import { getInstance, getItems } from '../../methods/VariableDescriptorMethods';
import { VariableDescriptor } from '../../selectors';
import {
  IQuestionDescriptor,
  IChoiceDescriptor,
  SChoiceDescriptor,
  IReply,
  IWhQuestionDescriptor,
  IBooleanDescriptor,
  IBooleanInstance,
  INumberDescriptor,
  INumberInstance,
  IStaticTextDescriptor,
  IStaticTextInstance,
  IStringDescriptor,
  IStringInstance,
  ITextDescriptor,
  ITextInstance,
} from 'wegas-ts-api';

import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SQuestionDescriptor, SQuestionInstance, SPlayer } from 'wegas-ts-api';
import { entityIs } from '../../entities';

export class SQuestionDescriptorImpl extends SQuestionDescriptor {
  private getReplies(self: Readonly<SPlayer>, onlyValidated?: boolean) {
    let replies: IReply[] = [];
    getChoices(this.getEntity()).map(cd => {
      const ci = getInstance(cd, self.getEntity());
      if (ci) {
        replies = replies.concat(ci.replies);
      }
    });
    if (onlyValidated) {
      replies = replies.filter(r => r.validated);
    }
    return this.client.instantiate(replies);
  }

  public isReplied(p: Readonly<SPlayer>): boolean {
    return this.getReplies(p, true).length > 0;
  }
  public isNotReplied(p: Readonly<SPlayer>): boolean {
    return !this.isReplied(p);
  }
  public isStillAnswerabled(p: Readonly<SPlayer>): boolean {
    const max = this.getMaxReplies();
    if (this.getValidated(p)) {
      return false;
    }
    if (max) {
      return (
        this.getReplies(p, true).filter(r => !r.getIgnored()).length >= max
      );
    }
    return true;
  }
  public setValidated(_p: Readonly<SPlayer>, _value: boolean): void {
    throw Error('This is readonly');
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public getValidated(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).isValidated();
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<SQuestionInstance> {
    return getScriptableInstance<SQuestionInstance>(this, player);
  }
  public getItems() {
    return getItems<SChoiceDescriptor>(this.entity.itemsIds);
  }
}

// Unmapped methods

export type IWhChoiceDescriptor =
  | ITextDescriptor
  | IStringDescriptor
  | IStaticTextDescriptor
  | INumberDescriptor
  | IBooleanDescriptor;

export type IWhChoiceInstance =
  | ITextInstance
  | IStringInstance
  | IStaticTextInstance
  | INumberInstance
  | IBooleanInstance;

export function getChoices(
  qd: IQuestionDescriptor,
): Readonly<IChoiceDescriptor>[];

export function getChoices(
  qd: IWhQuestionDescriptor,
): Readonly<IWhChoiceDescriptor>[];

export function getChoices(
  qd: IQuestionDescriptor | IWhQuestionDescriptor,
): Readonly<IChoiceDescriptor>[] | Readonly<IWhChoiceDescriptor>[] {
  if (entityIs(qd, 'QuestionDescriptor')) {
    return VariableDescriptor.select<IChoiceDescriptor>(qd.itemsIds).filter(
      c => c != null,
    ) as Readonly<IChoiceDescriptor>[];
  } else {
    return VariableDescriptor.select<IWhChoiceDescriptor>(qd.itemsIds).filter(
      c => c != null,
    ) as Readonly<IWhChoiceDescriptor>[];
  }
}
