import * as React from 'react';
import { Actions } from '../../data';
import { StoreConsumer } from '../../data/store';

interface Props {
  label: string;
  action: string;
}
export default function Button(props: Props) {
  return (
    <StoreConsumer selector={() => undefined}>
      {({ dispatch }) => (
        <button
          onClick={() => {
            dispatch(Actions.VariableDescriptorActions.runScript(props.action));
          }}
        >
          {props.label}
        </button>
      )}
    </StoreConsumer>
  );
}
