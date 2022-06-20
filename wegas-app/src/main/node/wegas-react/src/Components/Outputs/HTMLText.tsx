import * as React from 'react';
import { ITranslatableContent } from 'wegas-ts-api';
import { halfOpacity } from '../../css/classes';
import { classNameOrEmpty, classOrNothing } from '../../Helper/className';
import sanitize, { toFullUrl } from '../../Helper/sanitize';
import { useTranslate } from '../Hooks/useTranslate';

interface TextProps extends ClassStyleId {
  text?: string;
  disabled?: boolean;
  onPointerOver?: () => void;
}

export function HTMLText({
  text,
  style,
  className,
  id,
  disabled,
  onPointerOver,
}: TextProps) {
  return (
    <div
      id={id}
      className={
        classNameOrEmpty(className) + classOrNothing(halfOpacity, disabled)
      }
      style={style}
      onPointerOver={onPointerOver}
      dangerouslySetInnerHTML={{
        __html: sanitize(toFullUrl(text)),
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
