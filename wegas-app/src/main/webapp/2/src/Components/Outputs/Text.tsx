import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { ITranslatableContent } from 'wegas-ts-api';

interface TextProps extends ClassAndStyle {
  text?: string;
}

export function Text({ text, className, style }: TextProps) {
  return (
    <div className={className} style={style}>
      <div
        style={{ display: 'inline-block' }}
        dangerouslySetInnerHTML={{
          __html: text || '',
        }}
      />
    </div>
  );
}

interface TranslatableTextProps extends ClassAndStyle {
  htmlTranslatableContent: ITranslatableContent;
}

export function TranslatableText({
  htmlTranslatableContent,
  ...props
}: TranslatableTextProps) {
  const translatedContent = useTranslate(htmlTranslatableContent);
  return <Text {...props} text={translatedContent} />;
}
