import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';

import { SFSMDescriptor, SFSMInstance, SPlayer, STriggerDescriptor, SDialogueDescriptor } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SFSMDescriptorImpl extends SFSMDescriptor {
  public enable(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public disable(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public isEnabled(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getEnabled();
  }
  public wentThroughState(p: Readonly<SPlayer>, stateKey: number): boolean {
    return this.getInstance(p).getTransitionHistory().includes(stateKey);
  }
  public isDisabled(p: Readonly<SPlayer>): boolean {
    return !this.isEnabled(p);
  }
  public notWentThroughState(p: Readonly<SPlayer>, stateKey: number): boolean {
    return !this.wentThroughState(p, stateKey);
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SFSMInstance> {
    return getScriptableInstance<SFSMInstance>(this, player);
  }
}

export class STriggerDescriptorImpl extends STriggerDescriptor {
  public enable(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public disable(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public isEnabled(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getEnabled();
  }
  public wentThroughState(p: Readonly<SPlayer>, stateKey: number): boolean {
    return this.getInstance(p).getTransitionHistory().includes(stateKey);
  }
  public isDisabled(p: Readonly<SPlayer>): boolean {
    return !this.isEnabled(p);
  }
  public notWentThroughState(p: Readonly<SPlayer>, stateKey: number): boolean {
    return !this.wentThroughState(p, stateKey);
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SFSMInstance> {
    return getScriptableInstance<SFSMInstance>(this, player);
  }
}

export class SDialogueDescriptorImpl extends SDialogueDescriptor {
  public enable(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public disable(_p: Readonly<SPlayer>): void {
    throw new Error("This is readonly");
  }
  public isEnabled(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getEnabled();
  }
  public wentThroughState(p: Readonly<SPlayer>, stateKey: number): boolean {
    return this.getInstance(p).getTransitionHistory().includes(stateKey);
  }
  public isDisabled(p: Readonly<SPlayer>): boolean {
    return !this.isEnabled(p);
  }
  public notWentThroughState(p: Readonly<SPlayer>, stateKey: number): boolean {
    return !this.wentThroughState(p, stateKey);
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SFSMInstance> {
    return getScriptableInstance<SFSMInstance>(this, player);
  }
}