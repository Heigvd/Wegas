import * as React from 'react';
import { css, cx } from 'emotion';
import u from 'immer';
import { children } from '../EntitiesConfig/ChoiceDescriptor';
import Button from '../../Components/AutoImport/Button';

const flex = css({
  display: 'flex',
});

const grow = css({
  flex: '1 1 auto',
});

const hidden = css({
  display: 'none',
});

const modalBg = css({
  backgroundColor: 'lightgrey',
});

type AlertAction = (content: JSX.Element) => void;
type AcceptAction = (
  content: JSX.Element,
  acceptAction: () => void,
  cancelAction?: () => void,
) => void;
type PromptAction = (
  content: JSX.Element,
  acceptAction: (content: string) => void,
  cancelAction?: () => void,
) => void;

interface ModalSpecs {
  type: 'ALERT' | 'ACCEPT' | 'PROMPT';
  content: React.ReactNode;
  actions?: {
    [name: string]: (content?: string) => void;
  };
}

interface ModalLayoutProps {
  root?: boolean;
  children: (modals?: {
    walert: AlertAction;
    waccept: AcceptAction;
    wprompt: PromptAction;
  }) => React.ReactNode;
}

export function ModalLayout(props: ModalLayoutProps) {
  const [modals, setModals] = React.useState<ModalSpecs[]>([]);

  const consumeModal = () => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.shift();
        return oldModals;
      }),
    );
  };

  const walert = (content: JSX.Element) => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.push({ type: 'ALERT', content: content });
        return oldModals;
      }),
    );
  };

  const waccept = (
    content: JSX.Element,
    acceptAction: () => void,
    cancelAction?: () => void,
  ) => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.push({
          type: 'ACCEPT',
          content: content,
          actions: {
            OK: acceptAction,
            Cancel: cancelAction ? cancelAction : () => {},
          },
        });
        return oldModals;
      }),
    );
  };

  const wprompt = (
    content: JSX.Element,
    acceptAction: (content: string) => void,
    cancelAction?: () => void,
  ) => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.push({
          type: 'PROMPT',
          content: content,
          actions: {
            OK: acceptAction,
            Cancel: cancelAction ? cancelAction : () => {},
          },
        });
        return oldModals;
      }),
    );
  };

  return (
    <>
      <div className={cx(flex, grow, modals.length > 0 && hidden)}>
        {props.children({ walert: walert, waccept: waccept, wprompt: wprompt })}
      </div>
      <div className={cx(flex, grow, modals.length === 0 ? hidden : modalBg)}>
        <div>{modals[0].content}</div>
        <div>
          {modals[0].actions ? (
            Object.keys(modals[0].actions).map(actionName => {
              return (
                <div
                  key={actionName}
                  onClick={() => {
                    modals[0].actions![actionName];
                    consumeModal();
                  }}
                >
                  {actionName}
                </div>
              );
            })
          ) : (
            <div onClick={consumeModal}>OK</div>
          )}
        </div>
      </div>
    </>
  );
}
