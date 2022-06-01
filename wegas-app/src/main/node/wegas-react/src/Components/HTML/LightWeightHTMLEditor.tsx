import * as React from 'react';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { DummyHTMLEditor } from './DummyHTMLEditor';
import { HTMLEditorPropsMk2 } from './HTMLEditorMk2';

const HTMLEditorMk2 = React.lazy(() => import('./HTMLEditorMk2'));

export function LightWeightHTMLEditor(props: HTMLEditorPropsMk2) {
  const container = React.useRef<HTMLDivElement>(null);
  const [editorMode, setEditorMode] = React.useState(false);
  const i18nValues = useInternalTranslate(commonTranslations);
  useOnClickOutside(container, () => setEditorMode(false));
  return (
    <div ref={container} onClick={() => setEditorMode(true)}>
      {editorMode ? (
        <React.Suspense fallback={<div>{i18nValues.loading}...</div>}>
          <HTMLEditorMk2 {...props} />
        </React.Suspense>
      ) : (
        <DummyHTMLEditor value={props.value} />
      )}
    </div>
  );
}
