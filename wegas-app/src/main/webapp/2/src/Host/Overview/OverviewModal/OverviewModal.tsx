import { css, cx } from 'emotion';
import * as React from 'react';
import { Modal } from '../../../Components/Modal';
import '../../../Editor/Components/FormView';
import {
  ImpactModalContent,
  ImpactModalContentProps,
} from './ImpactModalContent';
import {
  FilterModalContent,
  FilterModalContentProps,
} from './FilterModalContent';
import { themeVar } from '../../../Components/Style/ThemeVars';
import { MailModalContent } from './MailModalContent';

const modalStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.3)',
});

const modalContentStyle = css({
  position: 'relative',
  padding: '40px',
  minWidth: '400px',
  maxWidth: '700px',
  boxShadow: '1px 2px 6px rgba(0,0,0,0.1)',
  '&>div': {
    color: themeVar.Common.colors.DarkTextColor,
  },
});

const modalInputsStyle = css({
  input: {
    fontFamily: themeVar.ComponentTitle.others.FontFamily2,
    borderRadius: 0,
    border: '1px solid ' + themeVar.Common.colors.HighlightColor,
    lineHeight: '1.8em',
    backgroundColor: themeVar.Common.colors.SecondaryBackgroundColor,
    marginLeft: '1px',
    '&:focus': {
      border: '1px solid ' + themeVar.Common.colors.PrimaryColor,
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
}

export function OverviewModal({
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
        />
      ) : null}
    </Modal>
  );
}
