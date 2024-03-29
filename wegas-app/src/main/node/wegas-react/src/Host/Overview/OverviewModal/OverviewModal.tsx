import { css, cx } from '@emotion/css';
import * as React from 'react';
import { Modal } from '../../../Components/Modal';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import '../../../Editor/Components/FormView';
import {
  FilterModalContent,
  FilterModalContentProps,
} from './FilterModalContent';
import {
  ImpactModalContent,
  ImpactModalContentProps,
} from './ImpactModalContent';
import { MailModalContent } from './MailModalContent';

const modalStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)',
});

const modalContentStyle = css({
  position: 'relative',
  overflow: 'auto',
  padding: '40px',
  minWidth: '400px',
  maxWidth: '700px',
  boxShadow: '1px 2px 6px rgba(0,0,0,0.1)',
  '&>div': {
    color: themeVar.colors.DarkTextColor,
  },
});

const modalInputsStyle = css({
  input: {
    fontFamily: themeVar.others.TextFont2,
    borderRadius: 0,
    border: '1px solid ' + themeVar.colors.HighlightColor,
    lineHeight: '1.8em',
    backgroundColor: themeVar.colors.SecondaryBackgroundColor,
    marginLeft: '1px',
    '&:focus': {
      border: '1px solid ' + themeVar.colors.PrimaryColor,
    },
    '&[readOnly]:focus': {
      outline: 'none',
    },
  },
});

export const modalButtonsContainer = css({
  marginTop: '20px',
});

export type ModalState = 'Close' | 'Mail' | 'Impacts' | 'Filter';

interface OverviewModalProps
  extends ImpactModalContentProps,
    FilterModalContentProps {
  modalState: ModalState;
  filterButtons?: () => JSX.Element;
}

export function OverviewModal({
  filterButtons,
  modalState,
  team,
  item,
  onExit,
  refreshOverview,
  overviewState,
  filterState,
  onNewFilterState,
}: OverviewModalProps) {
  return (
    <Modal
      onExit={onExit}
      className={modalStyle}
      innerClassName={cx(modalContentStyle, modalInputsStyle)}
    >
      {modalState === 'Impacts' ? (
        <ImpactModalContent
          team={team}
          onExit={onExit}
          item={item}
          refreshOverview={refreshOverview}
        />
      ) : modalState === 'Mail' ? (
        <MailModalContent team={team} onExit={onExit} />
      ) : modalState === 'Filter' ? (
        <FilterModalContent
          overviewState={overviewState}
          filterState={filterState}
          onNewFilterState={onNewFilterState}
          filterButtons={filterButtons}
        />
      ) : null}
    </Modal>
  );
}
