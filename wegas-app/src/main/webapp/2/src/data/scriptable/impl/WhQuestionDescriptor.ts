import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../../i18n';
import { SPlayer, SWhQuestionDescriptor, SWhQuestionInstance } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SWhQuestionDescriptorImpl extends SWhQuestionDescriptor {
  public isReplied(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).isValidated();
  }
  public isNotReplied(p: Readonly<SPlayer>): boolean {
    return !this.isReplied(p);
  }
  public getFeedback(p: Readonly<SPlayer>): string {
    return TranslatableContent.toString(this.getInstance(p).getFeedback());
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<import("wegas-ts-api/src/generated/WegasScriptableEntities").SWhQuestionInstance> {
    return getScriptableInstance<SWhQuestionInstance>(this, player);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public setFeedback(_p: Readonly<SPlayer>, _value: Readonly<import("wegas-ts-api/src/generated/WegasScriptableEntities").STranslatableContent>): void {
    throw Error('This is readonly');
  }
  public reopen(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
} 