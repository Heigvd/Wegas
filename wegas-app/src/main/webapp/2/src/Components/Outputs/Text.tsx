import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useComponentScript } from '../Hooks/useComponentScript';

export interface TextProps {
  script?: IScript;
  className?: string;
}

export function Text({ script, className }: TextProps) {
  const { content, instance, notFound } = useComponentScript<ITextDescriptor>(
    script,
  );
  return notFound ? (
    <span>Not found: {content}</span>
  ) : (
    <div className={className}>
      <div
        style={{ display: 'inline-block' }}
        dangerouslySetInnerHTML={{
          __html: TranslatableContent.toString(
            instance.trValue === undefined ? null : instance.trValue,
          ),
        }}
      />
    </div>
  );
}
