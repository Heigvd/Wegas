import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../Theme/ThemeVars';
import { all } from '../../data/selectors/VariableDescriptorSelector';
import { useStore } from '../../data/Stores/store';
import { IAchievementDescriptor, IAchievementInstance } from 'wegas-ts-api';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';

const containerStyle = css({
  height: '1em',
  width: '100%',
  lineHeight: '1',
  borderRadius: '50px',
  transition: 'all 0.5s',
  boxShadow: '0 0 5px ' + themeVar.colors.SuccessColor,
  margin: '5px',
});

const barStyle = css({
  borderRadius: 'inherit',
  height: 'inherit',
  lineHeight: 'inherit',
  textAlign: 'center',
  backgroundColor: '#69bd7f',
  color: 'white',
  transition: 'all 0.5s',
  overflow: 'hidden',
  ':before': {
    display: 'inline-block',
    content: '""',
  },
});

const valueStyle = css({
  display: 'inline-block',
  whiteSpace: 'nowrap',
});

export interface ProgressBarProps {
  /**
   * the quest to filter achievements
   */
  quest?: string;
  /**
   * How to display the progression
   */
  display: 'bar' | 'text';
  /**
   * How to display the value
   */
  displayValue: 'hidden' | 'percent' | 'absolute';
}

export function ProgressBar({
  quest,
  display,
  displayValue,
}: ProgressBarProps) {
  const getQuestStats = React.useCallback(() => {
    const ads = all(
      '@class',
      'AchievementDescriptor',
    ) as IAchievementDescriptor[];

    return ads
      .filter(ad => ad.quest === quest)
      .reduce<{ total: number; current: number }>(
        (acc, cur) => {
          acc.total += cur.weight;
          const instance = getInstance(cur) as IAchievementInstance;
          if (instance == null) {
            return acc;
          }
          if (instance.achieved) {
            acc.current += cur.weight;
          }
          return acc;
        },
        { total: 0, current: 0 },
      );
  }, [quest]);

  const stats = useStore(getQuestStats);

  const percent = stats.total > 0 ? (stats.current / stats.total) * 100 : 0;

  const label =
    displayValue === 'percent'
      ? percent.toFixed() + ' %'
      : displayValue === 'absolute'
      ? '' + stats.current + ' / ' + stats.total
      : '';

  if (display == 'bar') {
    return (
      <div className={containerStyle}>
        <div
          className={barStyle}
          style={{
            width: percent + '%',
          }}
        >
          <div className={valueStyle}>{label}</div>
        </div>
      </div>
    );
  } else {
    return <span>{label}</span>;
  }
}
