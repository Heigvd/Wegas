import { VariableDescriptor } from '../../selectors';
import { instantiate } from '..';
import { IQuestionDescriptor } from 'wegas-ts-api';

import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import {
  SChoiceDescriptor,
  SChoiceInstance,
  SPlayer,
  SSingleResultChoiceDescriptor,
} from 'wegas-ts-api';

export class SChoiceDescriptorImpl extends SChoiceDescriptor {
  public setCurrentResult(
    _player: Readonly<SPlayer>,
    _resultName: string,
  ): void {
    throw new Error('This is readonly');
  }
  public hasBeenSelected(p: Readonly<SPlayer>): boolean {
    return !!this.getInstance(p)
      .getReplies()
      .find(r => r.isValidated() && !r.getIgnored());
  }
  public hasNotBeenSelected(p: Readonly<SPlayer>): boolean {
    return !this.hasBeenSelected(p);
  }
  public hasBeenIgnored(p: Readonly<SPlayer>): boolean {
    if (this.hasBeenSelected(p)) {
      return false;
    } else {
      const iqd = VariableDescriptor.select<IQuestionDescriptor>(
        this.getParentId(),
      );
      if (iqd) {
        return instantiate(iqd).isStillAnswerabled(p);
      } else {
        throw Error('Question not found');
      }
    }
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw new Error('This is readonly');
  }
  public hasResultBeenApplied(
    p: Readonly<SPlayer>,
    resultName: string,
  ): boolean {
    return !!this.getInstance(p)
      .getReplies()
      .find(r => r.getResultName() === resultName);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw new Error('This is readonly');
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SChoiceInstance> {
    return getScriptableInstance<SChoiceInstance>(this, player);
  }
}
export class SSingleResultChoiceDescriptorImpl extends SSingleResultChoiceDescriptor {
  public setCurrentResult(
    _player: Readonly<SPlayer>,
    _resultName: string,
  ): void {
    throw new Error('This is readonly');
  }
  public hasBeenSelected(p: Readonly<SPlayer>): boolean {
    return !!this.getInstance(p)
      .getReplies()
      .find(r => r.isValidated() && !r.getIgnored());
  }
  public hasNotBeenSelected(p: Readonly<SPlayer>): boolean {
    return !this.hasBeenSelected(p);
  }
  public hasBeenIgnored(p: Readonly<SPlayer>): boolean {
    if (this.hasBeenSelected(p)) {
      return false;
    } else {
      const iqd = VariableDescriptor.select<IQuestionDescriptor>(
        this.getParentId(),
      );
      if (iqd) {
        return instantiate(iqd).isStillAnswerabled(p);
      } else {
        throw Error('Question not found');
      }
    }
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw new Error('This is readonly');
  }
  public hasResultBeenApplied(
    p: Readonly<SPlayer>,
    resultName: string,
  ): boolean {
    return !!this.getInstance(p)
      .getReplies()
      .find(r => r.getResultName() === resultName);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw new Error('This is readonly');
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SChoiceInstance> {
    return getScriptableInstance<SChoiceInstance>(this, player);
  }
}
