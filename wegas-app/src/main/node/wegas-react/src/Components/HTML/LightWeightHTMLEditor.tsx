import * as React from 'react';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { DummyHTMLEditor } from './DummyHTMLEditor';
import { HTMLEditorProps } from './HTMLEditor';

const HTMLEditor = React.lazy(() => import('./HTMLEditor'));

export function LightWeightHTMLEditor(props: HTMLEditorProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [editorMode, setEditorMode] = React.useState(false);
  const i18nValues = useInternalTranslate(commonTranslations);
  useOnClickOutside(container, () => setEditorMode(false));
  return (
    <div ref={container} onClick={() => setEditorMode(true)}>
      {editorMode ? (
        <React.Suspense fallback={<div>{i18nValues.loading}...</div>}>
          <HTMLEditor {...props} />
        </React.Suspense>
      ) : (
        <DummyHTMLEditor value={props.value} />
      )}
    </div>
  );
}
