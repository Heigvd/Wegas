import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import {
  SAchievementDescriptor,
  SPlayer,
  SAchievementInstance,
} from 'wegas-ts-api';

export class SAchievementDescriptorImpl extends SAchievementDescriptor {
  public getInstance(p: SPlayer): Readonly<SAchievementInstance> {
    return getScriptableInstance<SAchievementInstance>(this, p);
  }

  /**
   * mark the achievement as achieved or not
   * @param p        the player
   * @param achieved achived or not
   */
  public setAchieved(_p: SPlayer, _achieved: boolean): Readonly<void> {
    throw Error('This is readonly');
  }

  /**
   * Was the achievement achieved?
   * @param p the player
   * @return true if the achivement has been achieved
   */
  public isAchieved(p: SPlayer): Readonly<boolean> {
    return this.getInstance(p).isAchieved();
  }
}
