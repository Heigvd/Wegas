import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';

export interface TextProps extends ClassAndStyle {
  htmlTranslatableContent: ITranslatableContent;
}

export function Text({ htmlTranslatableContent, className, style }: TextProps) {
  const translatedContent = useTranslate(htmlTranslatableContent);
  return (
    <div className={className} style={style}>
      <div
        style={{ display: 'inline-block' }}
        dangerouslySetInnerHTML={{
          __html: translatedContent,
        }}
      />
    </div>
  );
}
