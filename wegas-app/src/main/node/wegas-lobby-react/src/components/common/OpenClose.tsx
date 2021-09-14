/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import Clickable from './Clickable';
import IconButton from './IconButton';

type State = {
  status: 'COLLAPSED' | 'EXPANDED';
};

export interface Props {
  closeIcon?: IconProp;
  showCloseIcon?: 'ICON' | 'NONE' | 'KEEP_CHILD';
  collaspedChildren: JSX.Element;
  children: (collapse: () => void) => JSX.Element;
}

const relative = css({
  position: 'relative',
});

const topRightAbs = css({
  position: 'absolute',
  top: 0,
  right: 0,
});

export default function OpenClose({
  collaspedChildren,
  children,
  closeIcon = faTimes,
  showCloseIcon = 'ICON',
}: Props): JSX.Element {
  const [state, setState] = React.useState<State>({
    status: 'COLLAPSED',
  });

  const collapse = React.useCallback(() => {
    setState({ status: 'COLLAPSED' });
  }, []);

  if (state.status === 'EXPANDED') {
    return (
      <div className={relative}>
        {showCloseIcon == 'KEEP_CHILD' ? collaspedChildren : null}
        {children(collapse)}
        {showCloseIcon == 'ICON' ? (
          <IconButton
            className={topRightAbs}
            icon={closeIcon}
            title="close"
            onClick={() => {
              setState({
                status: 'COLLAPSED',
              });
            }}
          />
        ) : null}
      </div>
    );
  } else {
    return (
      <div>
        <Clickable
          onClick={() => {
            setState({
              status: 'EXPANDED',
            });
          }}
        >
          {collaspedChildren}
        </Clickable>
      </div>
    );
  }
}
