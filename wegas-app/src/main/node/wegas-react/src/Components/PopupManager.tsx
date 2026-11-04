import { css, cx } from '@emotion/css';
import * as React from 'react';
import { flex, flexColumn, flexRow, itemCenter } from '../css/classes';
import { translate } from '../data/i18n';
import { useAppSelector } from '../store/hooks';
import { popupRemoved, selectPopups } from '../store/slices/popups';
import { dispatch } from '../store/store';
import { languagesCTX } from './Contexts/LanguagesProvider';
import { Button } from './Inputs/Buttons/Button';
import { themeVar } from './Theme/ThemeVars';
import {classNameOrEmpty} from "../Helper/className";

const popupBackgroundStyle = css({
  zIndex: 100000,
  position: 'fixed',
  width: '100%',
  height: '100%',
  visibility: 'hidden',
});

const popupStyle = css({
  width: 'min-content',
  whiteSpace: 'nowrap',
  margin: '5px',
  padding: '2px',
  backgroundColor: themeVar.colors.HeaderColor,
  visibility: 'visible',
  borderRadius: themeVar.dimensions.BorderRadius,
  borderWidth: themeVar.dimensions.BorderWidth,
  borderStyle: 'solid',
  borderColor: themeVar.colors.PrimaryColor,
});

export function PopupManager({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {
  const popups = useAppSelector(selectPopups);
  const { lang } = React.useContext(languagesCTX);
  return (
    <>
      <div className={cx(flex, flexColumn, itemCenter, popupBackgroundStyle)}>
        <div className={cx(flex, flexColumn, itemCenter)}>
          {Object.entries(popups).map(([id, { message, timestamp, className }]) => (
            <div key={id} className={cx(flex, flexRow, itemCenter, popupStyle) + classNameOrEmpty(className)}>
              <div>
                {`${new Date(timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })} : ${translate(message, lang)}`}
              </div>
              <Button
                icon="times"
                onClick={() => dispatch(popupRemoved(id))}
              />
            </div>
          ))}
        </div>
      </div>
      {children}
    </>
  );
}
