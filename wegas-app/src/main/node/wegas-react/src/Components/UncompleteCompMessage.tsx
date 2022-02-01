import { css, cx } from '@emotion/css';
import * as React from 'react';
import { defaultPadding } from '../css/classes';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { pagesTranslations } from '../i18n/pages/pages';
import CompNeedConfigIcon from '../pictures/compNeedConfig.svg';
import { themeVar } from './Theme/ThemeVars';

interface UncompleteCompMessageProps {
  color?: string;
}

export function UncompleteCompMessage({
  color = themeVar.colors.DarkTextColor,
}: UncompleteCompMessageProps) {
  const i18nValues = useInternalTranslate(pagesTranslations);
  return (
    <div
      className={cx(
        css({
          svg: {
            fill: color,
            maxWidth: '70px',
          },
          textAlign: 'center',
        }),
        defaultPadding,
      )}
    >
      <CompNeedConfigIcon />
      <p>{i18nValues.completeCompConfig}</p>
    </div>
  );
}
