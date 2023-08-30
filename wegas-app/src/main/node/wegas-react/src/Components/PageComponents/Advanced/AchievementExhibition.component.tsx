import * as React from 'react';
import { AchievementExhibition } from '../../Achivements/AchievementExhibition';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';

interface PlayerAchievementExhibitionProps extends WegasComponentProps {
  quest: string;
  display: 'bar' | 'text';
  displayValue: 'hidden' | 'percent' | 'absolute';
}

function PlayerAchievementExhibition(props: PlayerAchievementExhibitionProps) {
  return <AchievementExhibition quest={props.quest} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerAchievementExhibition,
    componentType: 'Advanced',
    id: 'Achievement Exhibitions',
    name: 'Achievement Exhibitions',
    icon: 'star',
    illustration: 'achievementExhibition',
    schema: {
      quest: {
        type: 'string',
        required: true,
        view: {
          type: 'questselect',
          label: 'Quest',
        },
      },
      ...classStyleIdSchema,
    },
    allowedVariables: ['AchievementDescriptor'],
    getComputedPropsFromVariable: v => {
      if (v != null) {
        return {
          quest: v.getQuest(),
        };
      } else {
        return {};
      }
    },
  }),
);
