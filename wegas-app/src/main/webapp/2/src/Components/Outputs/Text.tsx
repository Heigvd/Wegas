import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { ITranslatableContent } from 'wegas-ts-api';

interface TextProps extends ClassStyleId {
  text?: string;
}

export function Text({ text, style, className, id }: TextProps) {
  return (
    <div
      id={id}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{
        __html: text || '',
      }}
    />
  );
}

interface TranslatableTextProps extends ClassStyleId {
  htmlTranslatableContent: ITranslatableContent;
}

export function TranslatableText({
  htmlTranslatableContent,
  ...props
}: TranslatableTextProps) {
  const translatedContent = useTranslate(htmlTranslatableContent);
  return <Text {...props} text={translatedContent} />;
}
