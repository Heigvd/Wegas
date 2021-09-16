import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { TranslatableContent } from '../../i18n';
import {
  STextDescriptor,
  STextInstance,
  SPlayer,
  STranslatableContent,
} from 'wegas-ts-api';

export class STextDescriptorImpl extends STextDescriptor {
  public getValue(p: Readonly<SPlayer>): string {
    return TranslatableContent.toString(this.getInstance(p).getTrValue());
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<STextInstance> {
    return getScriptableInstance<STextInstance>(this, player);
  }
  public setValue(
    _p: Readonly<SPlayer>,
    _value: Readonly<STranslatableContent>,
  ): void {
    throw Error('This is readonly');
  }
  public setValueIfChanged(
    _p: Readonly<SPlayer>,
    _newValue: Readonly<STranslatableContent>,
  ): void {
    throw Error('This is readonly');
  }
}
