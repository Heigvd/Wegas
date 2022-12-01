import { css, cx } from '@emotion/css';
import * as React from 'react';
import { TabProps } from '../../Components/TabLayout/Tab';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';

const tabStyle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  margin: '0 3px',
  padding: '10px 20px',
  borderRadius:
    themeVar.dimensions.BorderRadius +
    ' ' +
    themeVar.dimensions.BorderRadius +
    ' 0 0',
  fontSize: '1em',
});

const inactiveTabStyle = css({
  backgroundColor: themeVar.colors.DisabledColor,
});
const activeTabStyle = css({
  backgroundColor: themeVar.colors.HighlightColor,
  fontWeight: 600,
});

export const overviewTabStyle = (active: boolean) =>
  cx(tabStyle, {
    [activeTabStyle]: active,
    [inactiveTabStyle]: !active,
  });

export const OverviewTab = React.forwardRef<HTMLDivElement, TabProps>(
  (props: TabProps, ref: React.RefObject<HTMLDivElement>) => {
    const i18nValues = useInternalTranslate(commonTranslations);
    return (
      <div ref={ref} className={props.className} onClick={props.onClick}>
        <React.Suspense fallback={<div>{i18nValues.loading}...</div>}>
          {props.children}
        </React.Suspense>
      </div>
    );
  },
);
