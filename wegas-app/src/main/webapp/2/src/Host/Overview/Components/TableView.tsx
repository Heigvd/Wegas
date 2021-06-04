import * as React from 'react';
import {
  componentOrRawHTML,
  ReactTransformer,
  TrainerComponentKey,
} from './components';

interface TableViewProps<K extends TrainerComponentKey> {
  header: (string | ReactTransformer<K>)[];
  content: (string | ReactTransformer<K>)[];
}

export function TableView<K extends TrainerComponentKey>({
  header,
  content,
}: TableViewProps<K>) {
  return (
    <table>
      <thead>
        {header.map((item, i) => (
          <th key={i}>{componentOrRawHTML(item)}</th>
        ))}
      </thead>
      <tbody>
        {content.map((item, i) => (
          <td key={i}>{componentOrRawHTML(item)}</td>
        ))}
      </tbody>
    </table>
  );
}

export function TestTableView() {
  return <TableView header={['1', '2', '3']} content={['A', 'B', 'C']} />;
}
