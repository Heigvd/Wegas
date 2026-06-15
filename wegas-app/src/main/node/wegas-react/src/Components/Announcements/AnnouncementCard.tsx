/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import tinycolor from 'tinycolor2';
import { IAnnouncement, IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
import { css, cx } from '@emotion/css';
import { useInternalTranslate } from "../../i18n/internalTranslator";
import { commonTranslations } from "../../i18n/common/common";
import { icons } from "../../Editor/Components/Views/FontAwesome";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FitSpace, Flex } from "../Flex";

export type SizeType = 'BIG' | 'MEDIUM' | 'SMALL';

const ANNOUNCEMENT_STYLE : Record<IAnnouncement['messageType'], { icon: IconProp, color: string }> = {
  WARNING:     { icon: icons.exclamation, color: '#EDE466' },
  MAINTENANCE: { icon: icons.exclamation, color: '#FF9369' },
  INCIDENT:    { icon: icons.times,       color: '#FF5E5E' },
  INFO:        { icon: icons.info,        color: '#A2E0F2' },
};

const ILLUSTRATION_STYLE : Record<SizeType, { size: string, iconSize: string }> = {
  SMALL:  { size: '48px', iconSize: '24px'},
  MEDIUM: { size: '64px', iconSize: '32px'},
  BIG:    { size: '80px', iconSize: '40px'},
};

// Styles
const announcementInfo = tinycolor('#0A9FF1');
const announcementInfoLight = tinycolor('#E1F0F8');
const announcementWarning = tinycolor('#FFC700');
const announcementWarningLight = tinycolor('#FAF5E1');
const announcementMaintenance = tinycolor('#FF7C00');
const announcementMaintenanceLight = tinycolor('#FAEBE1');
const announcementError = tinycolor('#DC0000');
const announcementErrorLight = tinycolor('#F5E1E1');

export const lightModeColors = css({
  '--bgColor': '#FEFEFE',
  '--fgColor': '#666',
  '--disabledFgColor': '#999',
  '--secBgColor': '#FFF',
  '--secFgColor': '#666',
  '--hoverBgColor': '#FFF0',
  '--hoverFgColor': '#999',
  '--linkColor': 'var(--fgColor)',
  '--linkHoverColor': 'var(--fgColor)',
  '--linkHoverBgColor': '#e6e6e6',
  '--focusColor': 'var(--pictoSteelBlue)',
});

export const lightMode = cx(
  lightModeColors,
  css({
    backgroundColor: 'var(--bgColor)',
    color: 'var(--fgColor)',
    '& a': {
      color: 'var(--linkColor)',
    },
  }),
);

const cardStyle = cx(
  lightMode,
  css({
    width: '100%',
    display: 'flex',
    backgroundColor: 'var(--bgColor)',
    margin: '6px auto',
    border: `none`,
    borderRadius: `2px`,
    boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.20)',
    alignItems: 'center',
    ':hover': {
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.33)',
    },
    pointerEvents: 'auto',
  }),
);

const cardContentStyle = css({
  padding: '0 10px',
  alignItems: 'center',
});

const cardDetailsStyle = css({
  fontSize: '13px',
  fontWeight: 300,
});

const cardTitleStyle = css({
  fontSize: '15px',
  fontWeight: 450,
});

const announcementCardStyle = css({
  minWidth: '300px',
  maxWidth: '900px',
  ['& > div:nth-child(2)']: {
    height: '100%',
  },
  ['&.INFO']: {
    color: announcementInfo.toString(),
    background: announcementInfoLight.toString(),
  },
  ['&.WARNING']: {
    color: announcementWarning.toString(),
    background: announcementWarningLight.toString(),
  },
  ['&.MAINTENANCE']: {
    color: announcementMaintenance.toString(),
    background: announcementMaintenanceLight.toString(),
  },
  ['&.INCIDENT']: {
    color: announcementError.toString(),
    background: announcementErrorLight.toString(),
  },
});

const announcementCardContentStyle = css({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexGrow: 1,
  gap: '10px',
  height: '100%',
  padding: '10px 0 10px 0',
});

const dismissStyle = css({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  padding: '0 6px 0 16px',
  borderLeft: '1px solid #d7d7d7',
  color: 'var(--fgColor)',
  textTransform: 'uppercase',
  ':hover': {
    cursor: 'pointer',
  },
});

const illustrationStyle = (color: string, backgroundColor: string, _size: SizeType) => {
  const { size, iconSize } = ILLUSTRATION_STYLE[_size]

  return css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: backgroundColor,
    color: color,
    width: size,
    minWidth: size,
    minHeight: size,
    lineHeight: size,
    fontSize: iconSize,
    textAlign: 'center',
    alignSelf: 'normal',
  });
}

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

interface announcementCardProps {
  announcement: IAnnouncementWithId;
  dismissable?: boolean;
  onDismiss?: () => void;
}

export function AnnouncementCard({ announcement, dismissable = false, onDismiss }: announcementCardProps): JSX.Element {
  const i18n = useInternalTranslate(commonTranslations);

  const formatDateCallback = React.useCallback((epoch: number) => {
    return new Date(epoch).toLocaleString(undefined, dateOptions);
  }, []);

  const { icon, color } = ANNOUNCEMENT_STYLE[announcement.messageType];

  const maintenanceContent = () => {
    if (announcement.messageType === 'MAINTENANCE') {
      return (
        <div className={cx(cardDetailsStyle, css({ marginTop: '10px' }))}>
          <div>
            {i18n.announcements.maintenanceStart} : {formatDateCallback(announcement.interventionStartTime!)}
          </div>
          <div>
            {i18n.announcements.maintenanceEnd} : {formatDateCallback(announcement.interventionEndTime!)}
          </div>
        </div>
      )
    }
  }

  return (
    <div className={cx(announcementCardStyle, cardStyle, announcement.messageType)}>
      <div className={illustrationStyle('white', color, 'MEDIUM')}>
        <FontAwesomeIcon title={announcement.messageType} icon={icon} />
      </div>
      <FitSpace direction="row" className={cardContentStyle}>
        <Flex className={announcementCardContentStyle}>
          <Flex direction='column'>
            <div className={cardTitleStyle}>{announcement.message}</div>
            {maintenanceContent()}
          </Flex>
          {dismissable ? (
            <div onClick={onDismiss} className={dismissStyle}>
              {i18n.dismiss}
            </div>
          ) : null}
        </Flex>
      </FitSpace>
    </div>
  )
}
