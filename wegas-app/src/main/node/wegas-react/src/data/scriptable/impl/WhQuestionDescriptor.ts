import {
  getItems,
  getScriptableInstance,
} from '../../methods/VariableDescriptorMethods';
import { translate } from '../../i18n';
import {
  SPlayer,
  SWhQuestionDescriptor,
  SWhQuestionInstance,
} from 'wegas-ts-api';

export class SWhQuestionDescriptorImpl extends SWhQuestionDescriptor {
  public isReplied(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).isValidated();
  }
  public isNotReplied(p: Readonly<SPlayer>): boolean {
    return !this.isReplied(p);
  }
  public getFeedback(p: Readonly<SPlayer>): string {
    return translate(this.getInstance(p).getFeedback());
  }
  public getInstance(
    player: Readonly<SPlayer>,
  ): Readonly<import('wegas-ts-api').SWhQuestionInstance> {
    return getScriptableInstance<SWhQuestionInstance>(this, player);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public setFeedback(
    _p: Readonly<SPlayer>,
    _value: Readonly<import('wegas-ts-api').STranslatableContent>,
  ): void {
    throw Error('This is readonly');
  }
  public reopen(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public getItems(): Readonly<SVariableDescriptor[]> {
    return getItems(this.entity.itemsIds);
  }
}
