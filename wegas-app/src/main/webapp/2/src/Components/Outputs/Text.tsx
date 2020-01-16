import * as React from 'react';
import { useScript } from '../Hooks/useScript';
import { useVariableInstance } from '../Hooks/useVariable';
import { TranslatableContent } from '../../data/i18n';

export interface TextProps {
  script?: IScript;
  className?: string;
}

export function Text({ script, className }: TextProps) {
  const textD = useScript(script ? script.content : '') as ISTextDescriptor;
  const textI = useVariableInstance(textD);
  return textD === undefined || textI === undefined ? (
    <span>Not found: {script}</span>
  ) : (
    <div className={className}>
      <div
        style={{ display: 'inline-block' }}
        dangerouslySetInnerHTML={{
          __html: TranslatableContent.toString(
            textI.trValue === undefined ? null : textI.trValue,
          ),
        }}
      />
    </div>
  );
}
