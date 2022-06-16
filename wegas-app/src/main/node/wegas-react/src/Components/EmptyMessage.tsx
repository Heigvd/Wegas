import { css } from '@emotion/css';
import * as React from 'react';
import { classNameOrEmpty } from '../Helper/className';
import { commonTranslations } from '../i18n/common/common';
import { useInternalTranslate } from '../i18n/internalTranslator';

const emptyMessageCss = css({
  fontStyle: 'italic',
  opacity: 0.6,
});

export function EmptyMessage({ className, style, id }: ClassStyleId) {
  const { empty } = useInternalTranslate(commonTranslations);
  return (
    <span
      id={id}
      style={style}
      className={emptyMessageCss + classNameOrEmpty(className)}
    >
      {empty}
    </span>
  );
}
