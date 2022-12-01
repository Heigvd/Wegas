import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import {
  SStringDescriptor,
  SStringInstance,
  SPlayer,
  STranslatableContent,
} from 'wegas-ts-api';
import { translate } from '../../i18n';

export class SStringDescriptorImpl extends SStringDescriptor {
  public getValue(p: Readonly<SPlayer>): string {
    return translate(this.getInstance(p).getTrValue(), p.getLang());
  }

  private parseStringValues(self: Readonly<SPlayer>): string[] {
    const json = this.getValue(self);

    if (json) {
      try {
        return JSON.parse(json) as string[];
      } catch (_e) {
        return [json];
      }
    } else {
      return [];
    }
  }

  public isValueSelected(p: Readonly<SPlayer>, value: string): boolean {
    const values = this.parseStringValues(p);
    return values.indexOf(value) >= 0;
  }

  public isNotSelectedValue(p: Readonly<SPlayer>, value: string): boolean {
    return !this.isValueSelected(p, value);
  }

  public areSelectedValues(
    p: Readonly<SPlayer>,
    expectedValues: readonly string[],
    strictOrder: boolean,
  ): boolean {
    const values = this.parseStringValues(p);
    if (values.length === expectedValues.length) {
      if (strictOrder) {
        for (let i = 0; i < values.length; i++) {
          if (values[i] !== expectedValues[i]) {
            return false;
          }
        }
      } else {
        for (let i = 0; i < values.length; i++) {
          if (values[i].indexOf(expectedValues[i]) < 0) {
            return false;
          }
        }
      }

      return true;
    }
    return false;
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SStringInstance> {
    return getScriptableInstance<SStringInstance>(this, player);
  }
  public countSelectedValues(p: Readonly<SPlayer>): number {
    return this.parseStringValues(p).length;
  }

  public getPositionOfValue(
    p: Readonly<SPlayer>,
    value: string,
  ): number | null {
    const position = this.parseStringValues(p).indexOf(value);
    if (position >= 0) {
      return position + 1;
    } else {
      return null;
    }
  }

  public setValue(
    _p: Readonly<SPlayer>,
    _value: Readonly<STranslatableContent>,
  ): void {
    throw new Error('This is readonlyx');
  }
}
