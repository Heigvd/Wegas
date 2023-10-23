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
import { getLogger } from '../../logger';
import { cardContainerStyle } from '../styling/style';
import FitSpace from './FitSpace';
import Flex from './Flex';

const logger = getLogger('WindowedContainer');

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
  scrollTo?: T | undefined;
  grow?: React.ComponentProps<typeof Flex>['grow'];
  bgColor?: string;
  gradientHeight?: number;
  /**
   * build a comp for a given children
   */
  children: (item: T) => React.ReactNode;
  emptyMessage: React.ReactNode;
}

const windowedContainerStyle = cx(
  cardContainerStyle,
  css({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    flexShrink: 1,
  }),
);

const itemsStyle = css({
  display: 'flex',
  flexDirection: 'column',
});

const containerStyle = css({
  position: 'relative',
});

const gradient = (bgColor: string, gradientHeight: number) =>
  css({
    pointerEvents: 'none',
    height: `${gradientHeight}px`,
    background: `linear-gradient(#FFF0, ${bgColor} 100%)`,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    transition: 'height 0.3s',
  });

const hideGradientStyle = css({
  height: 0,
});

export function WindowedContainer<T>({
  items,
  children,
  grow = 1,
  bgColor = '#F9F9F9',
  gradientHeight = 150,
  scrollTo,
  emptyMessage,
}: WCardContainerProps<T>): JSX.Element {
  const divRef = React.useRef<HTMLDivElement>(null);

  const data = React.useRef({
    numberOfRenderedItem: 5,
    numberOfVisibleItem: 5,
    sizePerItem: 0,
    paddingTop: 0,
    paddingBottom: 0,
  });
  const [padding, setPadding] = React.useState({ top: 0, bottom: 0, offset: 0 });

  const [showGradient, setShowGradient] = React.useState(true);

  const checkGradient = React.useCallback(() => {
    if (divRef.current != null) {
      const scrollBottom = divRef.current.scrollTop + divRef.current.offsetHeight;
      setShowGradient(divRef.current.scrollHeight - scrollBottom > 0);
    }
  }, []);

  React.useEffect(() => {
    checkGradient();
  }, [padding, checkGradient]);

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

  const build = React.useCallback(
    (nbAboveParam: number) => {
      if (divRef.current) {
        let nbAbove = nbAboveParam;
        const total = items.length;
        const perItem = data.current.sizePerItem;
        let nbBelow = total - nbAbove - data.current.numberOfRenderedItem;

        logger.debug('Build Div', { nbAbove, nbItem: total, perItem, nbBelow });

        if (nbAbove + data.current.numberOfVisibleItem > total) {
          nbAbove = Math.max(0, total - data.current.numberOfVisibleItem);
          nbBelow = 0;
        }

        if (nbBelow > total) {
          nbAbove = Math.max(0, total - data.current.numberOfRenderedItem);
        }
        logger.debug('Set Padding: ', {
          nbAbove,
          nbBelow,
          perItem,
          nbRenderedItems: data.current.numberOfRenderedItem,
          nbVisibleItems: data.current.numberOfVisibleItem,
          totalNbItem: total,
        });
        data.current.paddingTop = nbAbove * perItem;
        data.current.paddingBottom = nbBelow * perItem;
        setPadding({
          offset: nbAbove,
          top: data.current.paddingTop,
          bottom: data.current.paddingBottom,
        });
      }
    },
    [items.length],
  );

  // force effect when sizePerItem change
  const itemSize = data.current.sizePerItem;
  React.useEffect(() => {
    if (scrollTo != null) {
      const i = items.indexOf(scrollTo);
      if (i != null) {
        logger.debug('Scroll To: ', i, scrollTo);
        build(i);
        if (divRef.current) {
          divRef.current.scrollTop = data.current.paddingTop;
        }
      }
    }
  }, [scrollTo, items, build, itemSize]);

  const rebuildPaddings = React.useCallback(
    (items: T[]) => {
      const total = items.length;
      if (data.current.numberOfRenderedItem >= total) {
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
          const nbAbove = Math.floor(divRef.current.scrollTop / perItem);
          logger.debug('Rebuild Paddings ', {
            nbAbove,
            perItem,
            scrollTop: divRef.current.scrollTop,
          });
          build(nbAbove);
        }
      }
    },
    [build],
  );

  const recomputeCb = React.useCallback(() => {
    if (divRef.current != null) {
      const itemsDiv = divRef.current.querySelector('.items');
      if (itemsDiv) {
        const spaceUsed = itemsDiv.scrollHeight;
        //divRef.current.scrollHeight - data.current.paddingTop - data.current.paddingBottom;
        const parent = divRef.current.offsetParent;
        const availableSpace = parent != null ? parent.getBoundingClientRect().height : 0;

        const nbDisplayed = itemsDiv.children.length;
        logger.debug('Recompute ', spaceUsed, nbDisplayed, {
          total: divRef.current.scrollHeight,
          top: data.current.paddingTop,
          bottom: data.current.paddingBottom,
          spaceUsed,
          nbRendered: nbDisplayed,
          nbVisible: data.current.numberOfVisibleItem,
          availableSpace,
        });
        data.current.sizePerItem = spaceUsed / nbDisplayed;
        if (nbDisplayed < items.length) {
          data.current.numberOfVisibleItem = Math.min(
            Math.floor(availableSpace / data.current.sizePerItem),
            items.length,
          );
          data.current.numberOfRenderedItem = Math.min(data.current.numberOfVisibleItem * 2, items.length);
          rebuildPaddings(items);
        }
      }
    }
  }, [items, rebuildPaddings]);

  React.useEffect(() => {
    recomputeCb();
  }, [recomputeCb]);

  const onResizeCb = React.useCallback(() => {
    recomputeCb();
    checkGradient();
  }, [checkGradient, recomputeCb]);

  React.useEffect(() => {
    window.addEventListener('resize', onResizeCb);
    return () => {
      window.removeEventListener('resize', onResizeCb);
    };
  }, [onResizeCb]);

  const debScrollCb = React.useCallback(
    debounce(() => {
      rebuildPaddings(items);
    }, 100),
    [items],
  );

  const scrollCb = React.useCallback(() => {
    checkGradient();
    debScrollCb();
  }, [debScrollCb, checkGradient]);

  const cards = items
    .slice(padding.offset, padding.offset + data.current.numberOfRenderedItem)
    .map(item => children(item));
  return (
    <Flex className={containerStyle} shrink={1} grow={grow} direction="column" overflow="auto">
      {items.length === 0 ? emptyMessage : null}
      <div ref={divRef} className={windowedContainerStyle} onScroll={scrollCb}>
        <div style={{ height: `${padding.top}px`, flexShrink: 0 }}></div>
        <div className={`items ${itemsStyle}`}>{cards}</div>
        <div style={{ height: `${padding.bottom}px`, flexShrink: 0 }}></div>
      </div>
      <div
        className={cx(
          gradient(bgColor, gradientHeight),
          !showGradient ? hideGradientStyle : undefined,
        )}
      ></div>
    </Flex>
  );
}
