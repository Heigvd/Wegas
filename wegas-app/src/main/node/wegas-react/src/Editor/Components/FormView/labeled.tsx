import { css } from '@emotion/css';
import * as React from 'react';
import {
  featuresCTX,
  isFeatureEnabled,
} from '../../../Components/Contexts/FeaturesProvider';
import { hidden } from '../../../css/classes';

export const titleStyle = css({
  margin: '5px 0px',
  display: 'flex',
  fontWeight: 'bold',
  '[title]': {
    display: 'inline-block',
    borderBottom: '1px dotted',
    marginBottom: '2px',
    cursor: 'help',
  },
});

export interface LabeledView {
  label?: React.ReactNode;
  description?: string;
  index?: number;
  currentLanguage?: string;
}

interface LabeledProps extends LabeledView {
  children: (inputProps: {
    inputId: string;
    labelNode: JSX.Element;
  }) => React.ReactNode;
}
let id = 0;

/** Handle view's label and description  */
export const Labeled: React.FunctionComponent<LabeledProps> = ({
  label,
  children,
  description,
  index,
  currentLanguage,
}: LabeledProps) => {
  const internalId = React.useRef(`__labelInput__${id++}`);
  const { currentFeatures } = React.useContext(featuresCTX);

  return children({
    inputId: internalId.current,
    labelNode: (
      <label
        className={label ? titleStyle : hidden}
        htmlFor={internalId.current}
        title={description}
      >
        <span style={{ display: 'inline-flex' }}>
          {label}
          {currentLanguage && (
            <span style={{ marginLeft: '5px' }}>[{currentLanguage}]</span>
          )}
          {isFeatureEnabled(currentFeatures, 'INTERNAL') && index != null && (
            <span style={{ marginLeft: '1em' }}>{index}</span>
          )}
        </span>
      </label>
    ),
  }) as React.ReactElement;
};
