import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { ITranslatableContent } from 'wegas-ts-api';
import { classOrNothing } from '../../Helper/className';
import { halfOpacity } from '../../css/classes';

interface TextProps extends ClassStyleId {
  text?: string;
  disabled?: boolean;
}

export function HTMLText({ text, style, className, id, disabled }: TextProps) {
  return (
    <div
      id={id}
      className={className + classOrNothing(halfOpacity, disabled)}
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
  return <HTMLText {...props} text={translatedContent} />;
}
