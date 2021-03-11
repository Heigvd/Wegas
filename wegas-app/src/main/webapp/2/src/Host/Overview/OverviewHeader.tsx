import { css, cx } from 'emotion';
import * as React from 'react';
import {
  ActionItem,
  isDataItem,
  OverviewClickType,
  OverviewState,
} from './Overview';
import { firstScrollCellStyle, fixedCellStyle } from './OverviewCell';
import { OverviewButton } from './OverviewButton';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { flex, itemCenter, justifyCenter } from '../../css/classes';

const headerStyle = css({
  verticalAlign: 'middle',
  textAlign: 'center',
});

const fixedHeaderCellStyle = cx(
  css({
    backgroundColor: '#F9f9f9',
    height: '25px',
  }),
  fixedCellStyle,
);

interface OverviewHeaderProps {
  overviewState: OverviewState | undefined;
  onClick: (type: OverviewClickType, item?: ActionItem) => void;
}

export function OverviewHeader({
  overviewState,
  onClick,
}: OverviewHeaderProps) {
  return (
    <>
      <colgroup className="fixedColumn">
        <col />
      </colgroup>
      {!overviewState && (
        <colgroup>
          <col />
        </colgroup>
      )}
      {overviewState?.header &&
        overviewState.header.map((h, i) => (
          <colgroup key={h.title + i + 'col'}>
            <col span={h.span} />
          </colgroup>
        ))}
      <colgroup>
        <col span={2} />
      </colgroup>
      <thead className={headerStyle}>
        <tr>
          <th className={fixedHeaderCellStyle}>
            <div>Team</div>
          </th>
          {!overviewState && (
            <th rowSpan={2} className={firstScrollCellStyle}>
              Impact
            </th>
          )}
          {overviewState?.header &&
            overviewState.header.map((h, i) => (
              <th
                key={h.title + i}
                colSpan={h.span}
                className={cx({ [firstScrollCellStyle]: i === 0 })}
              >
                {h.title}
              </th>
            ))}
          <th colSpan={2}>Actions</th>
        </tr>
        <tr>
          <th className={fixedHeaderCellStyle}>Team (to hide!!)</th>
          {overviewState?.row.map((r, i) => {
            if (isDataItem(r)) {
              const { id, label } = r;
              return (
                <th
                  key={'header' + id}
                  className={cx({ [firstScrollCellStyle]: i === 0 })}
                >
                  {label || id}
                </th>
              );
            } else {
              const { id, label, hasGlobal } = r;
              return (
                <th
                  key={'header' + id}
                  className={cx({ [firstScrollCellStyle]: i === 0 })}
                >
                  {hasGlobal ? (
                    <div className={cx(flex, itemCenter, justifyCenter)}>
                      <OverviewButton item={r} onClick={onClick} />
                    </div>
                  ) : (
                    label
                  )}
                </th>
              );
            }
          })}
          <th>
            <div className={cx(flex, itemCenter, justifyCenter)}>
              <Button
                src={require('../../pictures/icon_mail.svg').default}
                tooltip="send mail"
                onClick={() => onClick('Mail')}
              />
            </div>
          </th>
          <th />
        </tr>
      </thead>
    </>
  );
}
