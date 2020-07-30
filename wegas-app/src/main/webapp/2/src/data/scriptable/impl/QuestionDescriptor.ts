import { getInstance } from '../../methods/VariableDescriptorMethods';
import { VariableDescriptor, Player } from '../../selectors';
import { IQuestionDescriptor, IPlayer, IChoiceDescriptor, IReply } from 'wegas-ts-api';

import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SQuestionDescriptor, SQuestionInstance, SPlayer } from 'wegas-ts-api';

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
      return this.getReplies(p, true)
        .filter(r => !r.getIgnored()).length >= max;
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
}

// Unmapped methods

export function getChoices(qd: IQuestionDescriptor) {
  return VariableDescriptor.select<IChoiceDescriptor>(qd.itemsIds).filter(
    c => c != null,
  ) as Readonly<IChoiceDescriptor>[];
}

export function isUnread(qd: IQuestionDescriptor) {
  return (self?: IPlayer) => {
    const p = self != null ? self : Player.selectCurrent();
    return (
      getChoices(qd)
        .map(cd => getInstance(cd, p))
        .filter(ci => ci && ci.unread).length > 0
    );
  };
}
