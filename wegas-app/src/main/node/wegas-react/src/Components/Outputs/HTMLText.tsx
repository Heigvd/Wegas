import * as React from 'react';
import { ITranslatableContent } from 'wegas-ts-api';
import { halfOpacity } from '../../css/classes';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { classNameOrEmpty, classOrNothing } from '../../Helper/className';
import sanitize from '../../Helper/sanitize';

interface TextProps extends ClassStyleId {
  text?: string;
  disabled?: boolean;
}

export function HTMLText({ text, style, className, id, disabled }: TextProps) {
  return (
    <div
      id={id}
      className={
        classNameOrEmpty(className) + classOrNothing(halfOpacity, disabled)
      }
      style={style}
      dangerouslySetInnerHTML={{
        __html: sanitize(text || ''),
      }}
    />
  );
}

interface TranslatableTextProps extends ClassStyleId {
  content?: ITranslatableContent | STranslatableContent | null;
}

/**
 * Provide a convinent way to translate and display a TranslatableContent
 */
export function TranslatableText({ content, ...props }: TranslatableTextProps) {
  const translatedContent = useTranslate(content);
  return <HTMLText {...props} text={translatedContent} />;
}
