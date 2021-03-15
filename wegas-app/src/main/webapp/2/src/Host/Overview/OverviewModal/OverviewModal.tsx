import { css } from 'emotion';
import * as React from 'react';
import { Modal } from '../../../Components/Modal';
import { themeVar } from '../../../Components/Style/ThemeVars';
import '../../../Editor/Components/FormView';
import { ActionItem } from '../Overview';
import { STeam } from 'wegas-ts-api';
import { ImpactModalContent } from './ImpactModalContent';
import { MailModalContent } from './MailModalContent';

const modalStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.2)',
});

const modalContentStyle = css({
  position: 'relative',
  padding: '22px',
  '&>div': {
    color: themeVar.Common.colors.ActiveColor,
  },
});

export const modalButtonsContainer = css({
  marginTop: '10px',
});

export type ModalState = 'Close' | 'Mail' | 'Impacts';

interface OverviewModalProps {
  modalState: ModalState;
  team?: STeam;
  item?: ActionItem;
  onExit: () => void;
  refreshOverview: () => void;
}

export function OverviewModal({
  modalState,
  team,
  item,
  onExit,
  refreshOverview,
}: OverviewModalProps) {
  return (
    <Modal
      onExit={onExit}
      className={modalStyle}
      innerClassName={modalContentStyle}
    >
      {modalState === 'Impacts' ? (
        <ImpactModalContent
          team={team}
          onExit={onExit}
          item={item}
          refreshOverview={refreshOverview}
        />
      ) : (
        <MailModalContent team={team} onExit={onExit} />
      )}
    </Modal>
  );
}
