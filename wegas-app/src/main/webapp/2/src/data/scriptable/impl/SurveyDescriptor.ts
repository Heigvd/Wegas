import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SSurveyDescriptor, SSurveyInstance, SPlayer } from 'wegas-ts-api/src/generated/WegasScriptableEntities';

export class SSurveyDescriptorImpl extends SSurveyDescriptor {


  public isActive(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getActive();
  }
  public isNotActive(p: Readonly<SPlayer>): boolean {
    return !this.isActive(p);
  }

  public isOngoing(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getStatus() === "ONGOING";
  }

  public isNotOngoing(p: Readonly<SPlayer>): boolean {
    return !this.isOngoing(p);
  }

  public isCompleted(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getStatus() === "COMPLETED";
  }

  public isNotCompleted(p: Readonly<SPlayer>): boolean {
    return !this.isNotCompleted(p);
  }

  public isClosed(p: Readonly<SPlayer>): boolean {
    return this.getInstance(p).getStatus() === "CLOSED";
  }

  public isNotClosed(p: Readonly<SPlayer>): boolean {
    return !this.isClosed(p);
  }

  public request(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public deactivate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public activate(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public complete(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }
  public close(_p: Readonly<SPlayer>): void {
    throw Error('This is readonly');
  }

  public getInstance(player: Readonly<SPlayer>): Readonly<SSurveyInstance> {
    return getScriptableInstance<SSurveyInstance>(this, player);
  }
}