import * as React from 'react';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { ITranslatableContent } from 'wegas-ts-api';
import { sanitize } from '../../Helper/sanitize';

interface TextProps extends ClassStyleId {
  text?: string;
}

// TODO: sanitize html
export function Text({ text, style, className, id }: TextProps) {
  return (
    <div
      id={id}
      className={className}
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
export function TranslatableText({
  content,
  ...props
}: TranslatableTextProps) {
  const translatedContent = useTranslate(content);
  return <Text {...props} text={translatedContent} />;
}
