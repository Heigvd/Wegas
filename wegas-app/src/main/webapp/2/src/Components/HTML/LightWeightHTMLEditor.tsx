import * as React from 'react';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { DummyHTMLEditor } from './DummyHTMLEditor';
import { HTMLEditorProps } from './HTMLEditor';

const HTMLEditor = React.lazy(() => import('./HTMLEditor'));

export function LightWeightHTMLEditor(props: HTMLEditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [editorMode, setEditorMode] = React.useState(false);
  useOnClickOutside(container, () => setEditorMode(false));
  return (
    <div ref={container} onClick={() => setEditorMode(true)}>
      {editorMode ? (
        <React.Suspense fallback={<div>Loading ...</div>}>
          <HTMLEditor {...props} />
        </React.Suspense>
      ) : (
        <DummyHTMLEditor value={props.value} />
      )}
    </div>
  );
}
