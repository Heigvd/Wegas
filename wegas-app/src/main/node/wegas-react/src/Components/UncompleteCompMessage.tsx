import { css, cx } from '@emotion/css';
import * as React from 'react';
import { defaultPadding, flex, flexColumn, itemCenter } from '../css/classes';
import { pageCTX } from '../Editor/Components/Page/PageEditor';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { pagesTranslations } from '../i18n/pages/pages';
import CompNeedConfigIcon from '../pictures/compNeedConfig.svg';
import { Button } from './Inputs/Buttons/Button';
import { themeVar } from './Theme/ThemeVars';

interface UncompleteCompMessageProps {
  message: string;
  color?: string;
  pageId: string | undefined;
  path: number[];
}

export function UncompleteCompMessage({
  message,
  color = themeVar.colors.DarkTextColor,
  pageId,
  path,
}: UncompleteCompMessageProps) {
  const i18nValues = useInternalTranslate(pagesTranslations);
  const { onEditComponent } = React.useContext(pageCTX);

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
        flex,
        flexColumn,
        itemCenter,
      )}
    >
      <CompNeedConfigIcon />
      <p>{i18nValues.completeCompConfig}</p>
      <p>{message}</p>
      {APP_CONTEXT === 'Editor' && (
        <Button
          label={i18nValues.editComponent}
          onClick={() => onEditComponent(pageId, path)}
        />
      )}
    </div>
  );
}
