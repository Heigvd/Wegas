import { cx } from '@emotion/css';
import * as React from 'react';
import { flex, flexRow, grow } from '../../css/classes';
import { HTMLText } from '../Outputs/HTMLText';

interface DummyHTMLEditorProps {
  value?: string;
}

export function DummyHTMLEditor({ value }: DummyHTMLEditorProps) {
  return (
    <div style={{ position: 'relative' }}>
      <div className={cx(flex, flexRow)}>
        <img src={require('../../pictures/htmleditorleft.png').default} />
        <div
          className={grow}
          ref={ref => {
            if (ref != null) {
              ref.style.backgroundImage =
                'url( ' +
                require('../../pictures/htmleditorcenter.png').default +
                ' )';
            }
          }}
        />
        <img src={require('../../pictures/htmleditorright.png').default} />
      </div>
      <HTMLText
        style={{
          position: 'absolute',
          top: '40px',
          left: '1px',
          width: '462px',
          height: '141px',
          overflow: 'hidden',
        }}
        text={value == null ? '' : value}
      />
    </div>
  );
}
