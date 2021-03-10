import { css, cx } from 'emotion';
import * as React from 'react';
import { isDataItem, OverviewState } from './Overview';
import { firstScrollCellStyle, fixedCellStyle } from './OverviewCell';
import { OverviewButton } from './OverviewButton';

const headerStyle = css({
  verticalAlign: 'middle',
  textAlign: 'center',
});

const fixedHeaderCellStyle = cx(
  css({
    backgroundColor: "#F9f9f9",
    height: "25px",
  }),
  fixedCellStyle);

interface OverviewHeaderProps {
  overviewState: OverviewState | undefined;
}

export function OverviewHeader({ overviewState }: OverviewHeaderProps) {
  return (
    <>
    <colgroup className="fixedColumn">
        <col/>
    </colgroup>
    {!overviewState && <colgroup><col/></colgroup>}
    {overviewState?.header &&
          overviewState.header.map((h, i) => (
            <colgroup><col key={h.title + i + 'col'} span={h.span} /></colgroup>
          ))}
    <colgroup>
        <col span={2}/>
    </colgroup>
    <thead className={headerStyle}>
      <tr>
        <th className={fixedHeaderCellStyle}><div>Team</div></th>
        {!overviewState && <th rowSpan={2} className={firstScrollCellStyle}>Impact</th>}
        {overviewState?.header &&
          overviewState.header.map((h, i) => (
            <th key={h.title + i} colSpan={h.span} className={cx({[firstScrollCellStyle]: i===0})}>
              {h.title}
            </th>
          ))}
          <th rowSpan={2}>Actions</th>
        </tr>
        <tr>
          <th className={fixedHeaderCellStyle}>Team (to hide!!)</th>
          {overviewState?.row.map((r, i) => {
            if (isDataItem(r)) {
              const { id, label } = r;
              return (
                <th
                  id={'header' + id}
                  className={cx({ [firstScrollCellStyle]: i === 0 })}
                >
                  {label || id}
                </th>
              );
            } else {
              const { id, label, hasGlobal, icon, ['do']: fn } = r;

              return (
                <th
                  id={'header' + id}
                  className={cx({ [firstScrollCellStyle]: i === 0 })}
                >
                  {hasGlobal ? (
                    <OverviewButton label={label} icon={icon} fn={fn} />
                  ) : (
                    label
                  )}
                </th>
              );
            }
          })}
        </tr>
      </thead>
    </>
  );
}
