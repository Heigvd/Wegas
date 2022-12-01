import { cx } from '@emotion/css';
import * as React from 'react';
import { flex, flexColumn, itemCenter } from '../css/classes';
import { useStore } from '../data/Stores/store';
import { commonTranslations } from '../i18n/common/common';
import { CommonTranslations } from '../i18n/common/definitions';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { TumbleLoader } from './Loader';
import { Modal } from './Modal';

function ServerStatusModal({
  label,
}: {
  label: keyof Pick<CommonTranslations, 'serverDown' | 'serverOutaded'>;
}) {
  const translations = useInternalTranslate(commonTranslations);
  return (
    <Modal
      innerStyle={{
        backgroundColor: 'white',
      }}
    >
      <div className={cx(flex, flexColumn, itemCenter)}>
        <TumbleLoader />
        <p>{translations[label]}</p>
      </div>
    </Modal>
  );
}

export function ServerStatusManager({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {
  const serverStatus = useStore(s => s.global.serverStatus);
  return (
    <>
      {serverStatus === 'DOWN' && <ServerStatusModal label="serverDown" />}
      {serverStatus === 'OUTDATED' && (
        <ServerStatusModal label="serverOutaded" />
      )}
      {children}
    </>
  );
}
