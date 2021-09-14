/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { debounce } from 'lodash';
import * as React from 'react';
import { cardContainerStyle } from '../styling/style';
import FitSpace from './FitSpace';

export interface CardContainerProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CardContainer({ className, children }: CardContainerProps): JSX.Element {
  return (
    <FitSpace direction="column" overflow="auto" className={cx(cardContainerStyle, className)}>
      {children}
    </FitSpace>
  );
}

export interface WCardContainerProps<T> {
  /**
   * list of all items
   */
  items: T[];
  /**
   * build a comp for a given children
   */
  children: (item: T) => React.ReactNode;
}

export function WindowedContainer<T>({ items, children }: WCardContainerProps<T>): JSX.Element {
  const divRef = React.useRef<HTMLDivElement>(null);

  const data = React.useRef({ numberOfItem: 5, sizePerItem: 0, paddingTop: 0, paddingBottom: 0 });
  const [padding, setPadding] = React.useState({ top: 0, bottom: 0, offset: 0 });

  //  // reset everything whene items change
  //  React.useEffect((
  //  ) => {
  //    console.log("The Reset Effect");
  //    data.current.numberOfItem = 5;
  //    data.current.sizePerItem = 0;
  //    // make sure to clear top and bottom paddings
  //    // so the layout effect will compute sizePerItem correctly
  //    setPadding({top: 0, bottom: 0, offset: 0});
  //  }, [items]);

  const rebuildPaddings = React.useCallback((items: T[]) => {
    const total = items.length;
    if (data.current.numberOfItem >= total) {
      // numberofitem to display not reache: do not window ever
      data.current.paddingTop = 0;
      data.current.paddingBottom = 0;
      setPadding({
        top: 0,
        bottom: 0,
        offset: 0,
      });
    } else {
      if (divRef.current) {
        const perItem = data.current.sizePerItem;
        let nbAbove = Math.floor(divRef.current.scrollTop / perItem);
        let nbBelow = total - nbAbove - data.current.numberOfItem;

        if (nbAbove > total - data.current.numberOfItem) {
          nbAbove = total - data.current.numberOfItem;
          nbBelow = 0;
        }

        if (nbBelow > total) {
          nbAbove = total - data.current.numberOfItem;
        }

        data.current.paddingTop = nbAbove * perItem;
        data.current.paddingBottom = nbBelow * perItem;
        setPadding({
          offset: nbAbove,
          top: data.current.paddingTop,
          bottom: data.current.paddingBottom,
        });
      }
    }
  }, []);

  React.useEffect(() => {
    if (divRef.current != null) {
      const spaceUsed =
        divRef.current.scrollHeight - data.current.paddingTop - data.current.paddingBottom;
      const parent = divRef.current.offsetParent;
      const availableSpace = parent != null ? parent.getBoundingClientRect().width : 0;

      const nbDisplayed = Math.min(data.current.numberOfItem, items.length);

      data.current.sizePerItem = spaceUsed / nbDisplayed;

      if (nbDisplayed < items.length) {
        data.current.numberOfItem = Math.ceil(availableSpace / data.current.sizePerItem) * 2;
        rebuildPaddings(items);
      }
    }
  }, [items, rebuildPaddings]);

  const scrollCb = React.useCallback(
    debounce(() => {
      rebuildPaddings(items);
    }, 100),
    [items],
  );
  const cards = items
    .slice(padding.offset, padding.offset + data.current.numberOfItem)
    .map(item => children(item));
  return (
    <div
      ref={divRef}
      className={cx(
        cardContainerStyle,
        css({
          display: 'flex',
          flexDirection: 'column',
          overflow: 'scroll',
          flexShrink: 1,
        }),
      )}
      onScroll={scrollCb}
    >
      <div style={{ height: `${padding.top}px`, flexShrink: 0 }}></div>
      {cards}
      <div style={{ height: `${padding.bottom}px`, flexShrink: 0 }}></div>
    </div>
  );
}
