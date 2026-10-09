import { css } from '@emotion/css';
import * as React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectServerStatus } from '../store/slices/connection';
import { commonTranslations } from '../i18n/common/common';
import { CommonTranslations } from '../i18n/common/definitions';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { TumbleLoader } from './Loader';
import { FloatingLayer } from "./Announcements/FloatingLayer";
import { Announcer } from "./Announcements/Announcer";
import Overlay from "./Overlay";

function ServerStatusModal({
  label,
}: {
  label: keyof Pick<CommonTranslations, 'serverDown' | 'serverOutaded'>;
}) {
  const translations = useInternalTranslate(commonTranslations);

  return (
      <Overlay>
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          })}
        >
          <TumbleLoader />
          <p>{translations[label]}</p>
        </div>
      </Overlay>
  );
}

export function ServerStatusManager({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {
  const serverStatus = useAppSelector(selectServerStatus);

  return (
    <>
      {serverStatus === 'DOWN' && <ServerStatusModal label="serverDown" />}
      {serverStatus === 'OUTDATED' && (
        <ServerStatusModal label="serverOutaded" />
      )}
      <FloatingLayer>
        <Announcer critical={serverStatus != 'READY'} />
      </FloatingLayer>
      {children}
    </>
  );
}
