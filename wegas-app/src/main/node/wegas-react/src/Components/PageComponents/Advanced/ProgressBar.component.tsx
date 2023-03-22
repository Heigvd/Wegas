import * as React from 'react';
import { ProgressBar } from '../../Achivements/AchievementProgressBar';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface PlayerProgressBarProps extends WegasComponentProps {
  quest: string;
  display: 'bar' | 'text';
  displayValue: 'hidden' | 'percent' | 'absolute';
}

function PlayerProgressBar(props: PlayerProgressBarProps) {
  return (
    <ProgressBar
      quest={props.quest}
      display={props.display}
      displayValue={props.displayValue}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerProgressBar,
    componentType: 'Advanced',
    id: 'Quest Progress Bar',
    name: 'Progress Bar',
    icon: 'certificate',
    illustration: 'questProgressBar',
    schema: {
      quest: {
        type: 'string',
        required: true,
        view: {
          type: 'questselect',
          label: 'Quest',
        },
      },
      display: schemaProps.select({
        label: 'Display',
        values: ['bar', 'text'],
        value: 'bar',
      }),
      displayValue: schemaProps.select({
        label: 'Display Value',
        values: ['hidden', 'percent', 'absolute'],
        value: 'percent',
      }),
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
