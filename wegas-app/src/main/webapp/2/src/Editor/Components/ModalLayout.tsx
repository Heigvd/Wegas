import * as React from 'react';
import { css, cx } from 'emotion';
import u from 'immer';

const flex = css({
  display: 'flex',
});

const grow = css({
  flex: '1 1 auto',
});

const modalBg = css({
  position: 'absolute',
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(155,155,155,0.7)',
});

const modalFg = css({
  margin: 'auto',
  padding: '1%',
  backgroundColor: 'white',
});

const modalContent = css({
  display: 'table',
  margin: 'auto',
  padding: '10%',
});

const modalButtonBar = css({
  display: 'flex',
  margin: 'auto',
});

type AlertCallback = () => void;
type AlertAction = (content: React.ReactNode, callback?: AlertCallback) => void;
type AcceptCallback = (accept: boolean) => void;
type AcceptAction = (
  content: React.ReactNode,
  callback: AcceptCallback,
) => void;
type PromptCallback = (value: string) => void;
type PromptAction = (
  content: React.ReactNode,
  callback: PromptCallback,
) => void;

interface WModals {
  walert: AlertAction;
  waccept: AcceptAction;
  wprompt: PromptAction;
  lockFields: boolean;
}

interface ModalSpecs {
  type: 'ALERT' | 'ACCEPT' | 'PROMPT';
  content: React.ReactNode;
  actions: {
    [name: string]: () => void;
  };
}

interface ModalLayoutProps {
  global?: boolean;
  children: (modals?: WModals, disabled?: boolean) => React.ReactNode;
}

export function ModalLayout(props: ModalLayoutProps) {
  const [modals, setModals] = React.useState<ModalSpecs[]>([]);
  const prompter = React.useRef('');

  const consumeModal = () => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.shift();
        return oldModals;
      }),
    );
  };

  const walert: AlertAction = (content, callback) => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.push({
          type: 'ALERT',
          content: content,
          actions: {
            OK: callback ? callback : () => {},
          },
        });
        return oldModals;
      }),
    );
  };

  const waccept: AcceptAction = (content, callback) => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.push({
          type: 'ACCEPT',
          content: content,
          actions: {
            OK: () => callback(true),
            Cancel: () => callback(false),
          },
        });
        return oldModals;
      }),
    );
  };

  const wprompt: PromptAction = (content, callback) => {
    setModals(oldModals =>
      u(oldModals, oldModals => {
        oldModals.push({
          type: 'PROMPT',
          content: content,
          actions: {
            OK: () => {
              callback(prompter.current);
            },
          },
        });
        return oldModals;
      }),
    );
  };

  if (props.global) {
    globalModals.walert = walert;
    globalModals.waccept = waccept;
    globalModals.wprompt = wprompt;
    globalModals.lockFields = modals.length > 0;
  }

  return (
    <>
      <div className={cx(flex, grow)}>
        {props.children({
          walert: walert,
          waccept: waccept,
          wprompt: wprompt,
          lockFields: modals.length > 0,
        })}
      </div>
      {modals.length > 0 && (
        <div className={cx(flex, grow, modalBg)}>
          <div className={modalFg}>
            <div className={modalContent}>{modals[0].content}</div>
            {modals[0].type === 'PROMPT' && (
              <input
                type={'text'}
                onChange={event => {
                  prompter.current = event.target.value;
                }}
              />
            )}
            <div className={modalButtonBar}>
              {modals[0].actions ? (
                Object.keys(modals[0].actions).map(actionName => {
                  return (
                    <button
                      key={actionName}
                      onClick={() => {
                        modals[0].actions![actionName]();
                        consumeModal();
                      }}
                      className={grow}
                    >
                      {actionName}
                    </button>
                  );
                })
              ) : (
                <button onClick={consumeModal}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const globalModals: WModals = {
  walert: () => {},
  waccept: () => false,
  wprompt: () => null,
  lockFields: false,
};
