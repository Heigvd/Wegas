import { css } from '@emotion/css';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import * as React from 'react';
import { IAchievementDescriptor, IAchievementInstance } from 'wegas-ts-api';
import { flex } from '../../css/classes';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { all } from '../../data/selectors/VariableDescriptorSelector';
import { useStore } from '../../data/Stores/store';
import { TranslatableText } from '../Outputs/HTMLText';
import { IconComp } from '../Views/FontAwesome';

export interface AchievementExhibitionProps {
  /**
   * the quest to filter achievements
   */
  quest?: string;
}

export function AchievementExhibition({ quest }: AchievementExhibitionProps) {
  const getData = React.useCallback(() => {
    return (all('@class', 'AchievementDescriptor') as IAchievementDescriptor[])
      .filter(ad => ad.quest === quest)
      .map(ad => ({ d: ad, i: getInstance(ad) as IAchievementInstance }));
  }, [quest]);

  const achievements = useStore(getData);

  return (
    <div>
      {achievements.map(achievement => {
        return achievement.i.achieved ? (
          <div key={achievement.d.id} className={flex}>
            <IconComp
              className={css({ color: achievement.d.color, fontSize: '2em' })}
              icon={achievement.d.icon as IconName}
            />
            <TranslatableText content={achievement.d.message} />
          </div>
        ) : null;
      })}
    </div>
  );
}
