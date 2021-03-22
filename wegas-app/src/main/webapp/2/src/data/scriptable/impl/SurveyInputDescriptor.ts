import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SSurveyChoicesDescriptor, SPlayer, SSurveyInputInstance, SSurveyTextDescriptor, SSurveyNumberDescriptor } from 'wegas-ts-api';

export class SSurveyChoicesDescriptorImpl extends SSurveyChoicesDescriptor {
  public activate(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public isNotActive(p: Readonly<SPlayer>): boolean {
    return !this.isActive(p);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(__p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SSurveyInputInstance> {
    return getScriptableInstance<SSurveyInputInstance>(this, player);
  }
}

export class SSurveyNumberDescriptorImpl extends SSurveyNumberDescriptor {
  public activate(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public isNotActive(p: Readonly<SPlayer>): boolean {
    return !this.isActive(p);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<SSurveyInputInstance> {
    return getScriptableInstance<SSurveyInputInstance>(this, player);
  }
}

export class SSurveyTextDescriptorImpl extends SSurveyTextDescriptor {
  public activate(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public isNotActive(p: Readonly<SPlayer>): boolean {
    return !this.isActive(p);
  }
  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public getInstance(player: Readonly<SPlayer>): Readonly<SSurveyInputInstance> {
    return getScriptableInstance<SSurveyInputInstance>(this, player);
  }
}