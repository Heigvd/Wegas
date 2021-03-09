import { css } from 'emotion';
import * as React from 'react';
import { isDataItem, OverviewState } from './Overview';
import { OverviewButton } from './OverviewHeaderButton';

const headerStyle = css({
  verticalAlign: 'middle',
  textAlign: 'center',
});

interface OverviewHeaderProps {
  overviewState: OverviewState | undefined;
}

export function OverviewHeader({ overviewState }: OverviewHeaderProps) {
  return (
    <thead className={headerStyle}>
      <tr>
        <td rowSpan={2}>Team</td>
        {!overviewState && <td rowSpan={2}>Impact</td>}
        {overviewState?.header &&
          overviewState.header.map((h, i) => (
            <td key={h.title + i} colSpan={h.span}>
              {h.title}
            </td>
          ))}
        <td rowSpan={2}>Actions</td>
      </tr>
      <tr>
        {overviewState?.row.map(r => {
          if (isDataItem(r)) {
            const { id, label } = r;
            return <td id={'header' + id}>{label}</td>;
          } else {
            const { id, label, hasGlobal, icon, ['do']: fn } = r;

            return (
              <td id={'header' + id}>
                {hasGlobal ? (
                  <OverviewButton label={label} icon={icon} fn={fn} />
                ) : (
                  label
                )}
              </td>
            );
          }
        })}
      </tr>
    </thead>
  );
}
