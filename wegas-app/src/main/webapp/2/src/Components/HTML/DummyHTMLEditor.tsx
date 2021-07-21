import * as React from 'react';
import { HTMLText } from '../Outputs/HTMLText';

interface DummyHTMLEditorProps {
  value?: string;
}

export function DummyHTMLEditor({ value }: DummyHTMLEditorProps) {
  return (
    <div style={{ position: 'relative' }}>
      <img
        src={require('../../pictures/htmleditor.png').default}
        onClick={() => {}}
      />
      <HTMLText
        style={{
          position: 'absolute',
          top: '40px',
          left: '1px',
          width: '462px',
          height: '141px',
          overflow: 'hidden',
        }}
        text={value == null ? '' : value }
      />
    </div>
  );
}
