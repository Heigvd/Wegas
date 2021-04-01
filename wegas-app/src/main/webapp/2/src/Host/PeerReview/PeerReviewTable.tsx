import { css } from 'emotion';
import * as React from 'react';
import { store } from '../../data/Stores/store';
import { TeamTD, OverviewTD, ReviewTD } from './PeerReviewCells';
import {
  DataItem,
  DataOverviewItem,
  PRTableData,
  StructureItem,
} from './PeerReviewPage';

// TODO use exported style from overview
const PRTableStyle = css({
  borderCollapse: 'separate',
  borderSpacing: '10px',
  margin: '40px 0',
  fontSize: '14px',
  colgroup: {
    borderLeft: 'solid 15px transparent',
    borderRight: 'solid 15px transparent',
  },
  td: {
    minWidth: '60px',
    backgroundColor: '#fff',
    boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
    padding: '10px 15px',
    textAlign: 'center',
    margin: '3px',
    height: '48px',
  },
  'thead tr': {
    height: '25px',
    th: {
      boxShadow: 'none',
      verticalAlign: 'top',
      padding: '0 10px',
      textAlign: 'center',
    },
  },
});

function isOverviewItem(item: DataItem): item is DataOverviewItem {
  return 'status' in item && 'commented' in item;
}

interface StructureItemWithTitle extends StructureItem {
  title: string;
}

interface PRTableProps extends PRTableData<DataItem> {
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function PRTable({ structures, data, onShowOverlay }: PRTableProps) {
  const items = structures.reduce(
    (o, s) => [
      ...o,
      ...s.items.map<StructureItemWithTitle>(i => ({ ...i, title: s.title })),
    ],
    [],
  );

  return (
    <table className={PRTableStyle}>
      <colgroup>
        <col />
      </colgroup>
      {structures.map(s => (
        <colgroup key={s.id + 'COLGROUP'}>
          <col span={s.items.length} />
        </colgroup>
      ))}

      <thead>
        <tr>
          <th rowSpan={2}>Equipe</th>
          {structures.map(s => (
            <th key={s.id} colSpan={s.items.length}>
              {s.title}
            </th>
          ))}
        </tr>
        <tr>
          {structures.map(s =>
            s.items.map(i => <td key={JSON.stringify(i)}>{i.label}</td>),
          )}
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr key={key}>
            <TeamTD
              teamName={store.getState().teams[key]?.name}
              value={value.variable}
              onShowOverlay={onShowOverlay}
            />
            {isOverviewItem(value) ? (
              <>
                <OverviewTD value={value.status} color={value.color} />
                <OverviewTD
                  value={value.commented}
                  color={value.comments_color}
                />
                <OverviewTD value={value.done} color={value.done_color} />
              </>
            ) : (
              items.map(i => (
                <ReviewTD
                  key={JSON.stringify(i) + i.id}
                  value={value[i.id]}
                  title={i.title}
                  data={value}
                  formatter={i.formatter}
                  onShowOverlay={onShowOverlay}
                />
              ))
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
