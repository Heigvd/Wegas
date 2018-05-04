import * as React from 'react';
import { ExpressionStatement } from '@babel/types';
interface ImpactProps {
  stmt: ExpressionStatement;
  onChange: (stmt: ExpressionStatement) => void;
}
export class Impact extends React.Component<ImpactProps> {
  render() {
    return <pre>{JSON.stringify(this.props.stmt, null, 2)}</pre>;
  }
}
