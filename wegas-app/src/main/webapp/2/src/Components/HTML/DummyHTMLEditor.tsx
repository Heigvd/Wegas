import * as React from 'react';

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
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '1px',
          width: '462px',
          height: '141px',
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: value == null ? '' : value }}
      />
    </div>
  );
}
