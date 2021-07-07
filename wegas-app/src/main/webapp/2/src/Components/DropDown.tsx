import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from './Theme/ThemeVars';
import { classNameOrEmpty } from '../Helper/className';
import { useOnClickOutside } from './Hooks/useOnClickOutside';

export const itemStyle = css({
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    textShadow: '0 0 1px',
  },
});
export const containerStyle = css({
  display: 'inline-block',
  position: 'relative',
});
export const contentContainerStyle = css({
  color: themeVar.colors.DarkTextColor,
  backgroundColor: themeVar.colors.BackgroundColor,
  position: 'fixed',
  overflow: 'auto',
  maxHeight: '500px',
  maxWidth: '500px',
  zIndex: 10000,
  whiteSpace: 'nowrap',
  boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.1)',
  '>div': {
    padding: '4px 10px',
  },
  [`& .${containerStyle}`]: {
    width: '100%',
  },
});

interface ContainerValues {
  left: number;
  width: number;
  top: number;
  height: number;
}

function overflowLeft(values: ContainerValues) {
  return values.left < 0;
}
function overflowRight(values: ContainerValues) {
  return values.left + values.width > window.innerWidth;
}

function ajustHorizontally(values: ContainerValues) {
  const newValues = values;

  // Check left
  if (overflowLeft(newValues)) {
    // Move right
    newValues.left = 0;
  }
  // Check right
  if (overflowRight(newValues)) {
    // Move left
    newValues.left = window.innerWidth - newValues.width;
  }
  // Check left again
  if (overflowLeft(newValues)) {
    // Move right
    newValues.left = 0;
    // Element too big, shrink width
    newValues.width = window.innerWidth;
  }
  return newValues;
}

function overflowTop(values: ContainerValues) {
  return values.top < 0;
}
function overflowBottom(values: ContainerValues) {
  return values.top + values.height > window.innerHeight;
}

function ajustVertically(values: ContainerValues) {
  const newValues = values;

  // Check top
  if (overflowTop(newValues)) {
    // Move bottom
    newValues.top = 0;
  }
  // Check bottom
  if (overflowBottom(newValues)) {
    // Move top
    newValues.top = window.innerHeight - newValues.height;
  }
  // Check top again
  if (overflowTop(newValues)) {
    // Move bottom
    newValues.top = 0;
    // Element too big, shrink height
    newValues.height = window.innerHeight;
  }
  return newValues;
}

function ajustVerticalOverlap(values: ContainerValues, parent: HTMLElement) {
  let newTopUp = parent.getBoundingClientRect().top - values.height;
  const newTopDown =
    parent.getBoundingClientRect().top + parent.getBoundingClientRect().height;
  let newHeightUp = values.height;
  let newHeightDown = values.height;

  if (newTopUp < 0) {
    newTopUp = 0;
    newHeightUp = parent.getBoundingClientRect().top;
  }
  if (newTopDown + newHeightDown > window.innerHeight) {
    newHeightDown = window.innerHeight - newTopDown;
  }

  if (newHeightUp > newHeightDown) {
    return {
      ...values,
      top: newTopUp,
      height: newHeightUp,
    };
  } else {
    return {
      ...values,
      top: newTopDown,
      height: newHeightDown,
    };
  }
}

function ajustHorizontalOverlap(values: ContainerValues, parent: HTMLElement) {
  let newLeftUp = parent.getBoundingClientRect().left - values.width;
  const newLeftDown =
    parent.getBoundingClientRect().left + parent.getBoundingClientRect().width;
  let newWidthUp = values.width;
  let newWidthDown = values.width;

  if (newLeftUp < 0) {
    newLeftUp = 0;
    newWidthUp = parent.getBoundingClientRect().left;
  }
  if (newLeftDown + newWidthDown > window.innerWidth) {
    newWidthDown = window.innerWidth - newLeftDown;
  }

  if (newWidthUp > newWidthDown) {
    return {
      ...values,
      left: newLeftUp,
      width: newWidthUp,
    };
  } else {
    return {
      ...values,
      left: newLeftDown,
      width: newWidthDown,
    };
  }
}

interface ParentAndChildrenRectangles {
  childrenTop: number;
  childrenLeft: number;
  childrenBottom: number;
  childrenRight: number;
  parentTop: number;
  parentLeft: number;
  parentBottom: number;
  parentRight: number;
}

export type DropDownDirection = 'left' | 'down' | 'right' | 'up';

function valuesToSides(
  values: ContainerValues,
  parent: HTMLElement,
): ParentAndChildrenRectangles {
  const { top: childrenTop, left: childrenLeft } = values;
  const childrenBottom = childrenTop + values.height;
  const childrenRight = childrenLeft + values.width;

  const { top: parentTop, left: parentLeft } = parent.getBoundingClientRect();
  const parentBottom = parentTop + parent.getBoundingClientRect().height;
  const parentRight = parentLeft + parent.getBoundingClientRect().width;

  return {
    childrenTop,
    childrenLeft,
    childrenBottom,
    childrenRight,
    parentTop,
    parentLeft,
    parentBottom,
    parentRight,
  };
}

function isOverlappingHorizontally(
  values: ContainerValues,
  parent: HTMLElement,
) {
  const { childrenRight, parentLeft, childrenLeft, parentRight } =
    valuesToSides(values, parent);
  if (childrenRight <= parentLeft || childrenLeft >= parentRight) {
    return false;
  }

  return true;
}

function isOverlappingVertically(values: ContainerValues, parent: HTMLElement) {
  const { childrenBottom, parentTop, childrenTop, parentBottom } =
    valuesToSides(values, parent);
  if (childrenBottom <= parentTop || childrenTop >= parentBottom) {
    return false;
  }

  return true;
}

export function justifyDropMenu(
  menu: HTMLElement | null,
  selector: HTMLElement | undefined | null,
  direction: DropDownDirection,
) {
  const vertical = direction === 'down' || direction === 'up';

  if (menu != null && selector != null) {
    const { width: containerWidth, height: containerHeight } =
      menu.getBoundingClientRect();

    let values: ContainerValues = {
      left: vertical
        ? selector.getBoundingClientRect().left
        : direction === 'left'
        ? selector.getBoundingClientRect().left - containerWidth
        : selector.getBoundingClientRect().left +
          selector.getBoundingClientRect().width,
      width: containerWidth,
      top: !vertical
        ? selector.getBoundingClientRect().top
        : direction === 'up'
        ? selector.getBoundingClientRect().top - containerHeight
        : selector.getBoundingClientRect().top +
          selector.getBoundingClientRect().height,
      height: containerHeight,
    };

    // moving menu list into the visible window
    values = ajustHorizontally(values);
    values = ajustVertically(values);

    if (vertical && isOverlappingVertically(values, selector)) {
      values = ajustVerticalOverlap(values, selector);
    } else if (!vertical && isOverlappingHorizontally(values, selector)) {
      values = ajustHorizontalOverlap(values, selector);
    }

    menu.style.setProperty('left', values.left + 'px');
    if (values.width !== containerWidth) {
      menu.style.setProperty('width', values.width + 'px');
    }
    menu.style.setProperty('top', values.top + 'px');
    menu.style.setProperty('height', values.height + 'px');
    menu.style.setProperty('position', 'fixed');
  }
}

export interface DropDownProps {
  id?: string;
  label: React.ReactNode;
  content: React.ReactNode;
  direction?: DropDownDirection;
  containerClassName?: string;
  listClassName?: string;
  style?: React.CSSProperties;
}

export function DropDown({
  id,
  label,
  content,
  direction = 'down',
  containerClassName,
  listClassName,
  style,
}: DropDownProps) {
  const mainContainer = React.useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = React.useState(false);

  useOnClickOutside(mainContainer, () => setOpen(false));

  return (
    <div
      ref={mainContainer}
      id={id}
      className={containerClassName}
      style={style}
    >
      <div className={itemStyle} onClick={() => setOpen(isOpen => !isOpen)}>
        {label}
      </div>

      {isOpen && (
        <div
          className={contentContainerStyle + classNameOrEmpty(listClassName)}
          ref={n => {
            justifyDropMenu(n, n?.parentElement, direction);
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
