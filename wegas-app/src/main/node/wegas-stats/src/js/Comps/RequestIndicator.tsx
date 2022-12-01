import * as React from 'react';
import {useAppSelector} from '../Store/hooks';

export default function RequestIndicator() {
  const count = useAppSelector(state => state.global.request);
  if (count > 0) {
    return (
      <span
        style={{
          margin: '0 10px',
          color: 'lightgray',
          float: 'right',
        }}
      >
        Loading... ({count})
      </span>
    );
  }
  return null;
}