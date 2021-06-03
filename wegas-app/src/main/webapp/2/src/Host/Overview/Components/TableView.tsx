import * as React from 'react';

interface TableViewProps {
  header: React.ReactNode[];
  content: React.ReactNode[];
}

export function TableView({ header, content }: TableViewProps) {
  return (
    <table>
      <thead>
        {header.map((item, i) => (
          <th key={i}>{item}</th>
        ))}
      </thead>
      <tbody>
        {content.map((item, i) => (
          <td key={i}>{item}</td>
        ))}
      </tbody>
    </table>
  );
}

export function TestTableView() {
  return <TableView header={[1, 2, 3]} content={['A', 'B', 'C']} />;
}
