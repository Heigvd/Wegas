import * as React from 'react';
import { css } from 'emotion';

export interface LabeledView {
  label?: string;
  description?: string;
}
interface LabeledProps extends LabeledView {
  children: (
    inputProps: { inputId: string; labelNode: JSX.Element },
  ) => React.ReactNode;
}
const titleStyle = css({
  '[title]': {
    display: 'inline-block',
    borderBottom: '1px dotted',
    marginBottom: '2px',
    cursor: 'help',
  },
});
let id = 0;
/** Handle view's label and description  */
export class Labeled extends React.Component<LabeledProps> {
  id: string;
  constructor(props: LabeledProps) {
    super(props);
    this.id = `__labelInput__${id++}`;
  }
  render() {
    const { label, children, description } = this.props;
    return children({
      inputId: this.id,
      labelNode: (
        <label className={titleStyle} htmlFor={this.id} title={description}>
          {label}
        </label>
      ),
    });
  }
}
