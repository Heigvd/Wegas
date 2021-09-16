import { css, CSSInterpolation, CSSObject, cx } from '@emotion/css';
import * as React from 'react';

export function getClientPosition(e: MouseEvent | TouchEvent) {
  if ('touches' in e) {
    const touches = e.touches;

    if (touches && touches.length) {
      const finger = touches[0];
      return {
        x: finger.clientX,
        y: finger.clientY,
      };
    }
  }

  if ('clientX' in e && 'clientY' in e) {
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }

  return {
    x: 0,
    y: 0,
  };
}

const track: CSSObject = {
  position: 'relative',
  display: 'inline-block',
  backgroundColor: '#ddd',
  borderRadius: 5,
  userSelect: 'none',
  boxSizing: 'border-box',
};

const active: CSSObject = {
  position: 'absolute',
  backgroundColor: '#5e72e4',
  borderRadius: 5,
  userSelect: 'none',
  boxSizing: 'border-box',
};

const thumb: CSSObject = {
  position: 'relative',
  display: 'block',
  content: '""',
  width: 18,
  height: 18,
  backgroundColor: '#fff',
  borderRadius: '50%',
  boxShadow: '0 1px 1px rgba(0,0,0,.5)',
  userSelect: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

type AxisType = 'x' | 'y' | 'xy';

interface CustomPropType {
  track: CSSInterpolation;
  active: CSSInterpolation;
  thumb: CSSInterpolation;
}

interface StyleType {
  disabled: CSSInterpolation;
  x: CustomPropType;
  y: CustomPropType;
  xy: CustomPropType;
}

const defaultStyles: StyleType = {
  x: {
    track: {
      ...track,
      width: 200,
      height: 10,
    },

    active: {
      ...active,
      top: 0,
      height: '100%',
    },

    thumb: {
      ...thumb,
    },
  },

  y: {
    track: {
      ...track,
      width: 10,
      height: 200,
    },

    active: {
      ...active,
      left: 0,
      width: '100%',
    },

    thumb: {
      ...thumb,
    },
  },

  xy: {
    track: {
      position: 'relative',
      overflow: 'hidden',
      width: 200,
      height: 200,
      backgroundColor: '#5e72e4',
      borderRadius: 0,
    },

    active: {},

    thumb: {
      ...thumb,
    },
  },

  disabled: {
    opacity: 0.5,
  },
};

export interface InputSliderProps {
  axis?: AxisType;
  x?: number;
  xmax?: number;
  xmin?: number;
  y?: number;
  ymax?: number;
  ymin?: number;
  xstep?: number;
  ystep?: number;
  onChange?: (values: { x: number; y: number }) => void;
  onDragStart?: (e: MouseEvent | TouchEvent) => void;
  onDragEnd?: (e: MouseEvent | TouchEvent) => void;
  disabled?: boolean;
  xreverse?: boolean;
  yreverse?: boolean;
  styles?: {
    track?: CSSObject;
    active?: CSSObject;
    thumb?: CSSObject;
    disabled?: CSSObject;
  };
}

const Slider = ({
  disabled = false,
  axis = 'x',
  x = 50,
  y = 50,
  xmin = 0,
  xmax = 100,
  ymin = 0,
  ymax = 100,
  xstep = 1,
  ystep = 1,
  onChange,
  onDragStart,
  onDragEnd,
  xreverse = false,
  yreverse = false,
  styles: customStyles,
  ...props
}: InputSliderProps) => {
  const container = React.useRef<HTMLDivElement>(null);
  const handle = React.useRef<HTMLDivElement>(null);
  const start = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offset = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  function getPosition() {
    let top = ((y - ymin) / (ymax - ymin)) * 100;
    let left = ((x - xmin) / (xmax - xmin)) * 100;

    if (top > 100) top = 100;
    if (top < 0) top = 0;
    if (axis === 'x') top = 0;

    if (left > 100) left = 100;
    if (left < 0) left = 0;
    if (axis === 'y') left = 0;

    return { top, left };
  }

  function change({ top, left }: { top: number; left: number }) {
    if (!onChange) return;

    if (container.current != null) {
      const { width, height } = container.current.getBoundingClientRect();
      let dx = 0;
      let dy = 0;

      if (left < 0) left = 0;
      if (left > width) left = width;
      if (top < 0) top = 0;
      if (top > height) top = height;

      if (axis === 'x' || axis === 'xy') {
        dx = (left / width) * (xmax - xmin);
      }

      if (axis === 'y' || axis === 'xy') {
        dy = (top / height) * (ymax - ymin);
      }

      const x = (dx !== 0 ? Math.floor(dx / xstep) * xstep : 0) + xmin;
      const y = (dy !== 0 ? Math.floor(dy / ystep) * ystep : 0) + ymin;

      onChange({
        x: xreverse ? xmax - x + xmin : x,
        y: yreverse ? ymax - y + ymin : y,
      });
    }
  }

  function handleMouseDown(
    e:
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | React.TouchEvent<HTMLDivElement>,
  ) {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const dom = handle.current;
    const clientPos = getClientPosition(e.nativeEvent);

    if (dom != null) {
      start.current = {
        x: dom.offsetLeft,
        y: dom.offsetTop,
      };
    }

    offset.current = {
      x: clientPos.x,
      y: clientPos.y,
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);

    if (onDragStart) {
      onDragStart(e.nativeEvent);
    }
  }

  function getPos(e: MouseEvent | TouchEvent) {
    if (start.current != null) {
      const clientPos = getClientPosition(e);
      const left = clientPos.x + start.current.x - offset.current.x;
      const top = clientPos.y + start.current.y - offset.current.y;

      return { left, top };
    }
    return { left: 0, top: 0 };
  }

  function handleDrag(e: MouseEvent | TouchEvent) {
    if (disabled) return;

    e.preventDefault();
    change(getPos(e));
  }

  function handleDragEnd(e: MouseEvent) {
    if (disabled) return;

    e.preventDefault();
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);

    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('touchcancel', handleDragEnd);

    if (onDragEnd) {
      onDragEnd(e);
    }
  }

  function handleTrackMouseDown(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return;
    if (container.current != null) {
      e.preventDefault();
      const clientPos = getClientPosition(e.nativeEvent);
      const rect = container.current.getBoundingClientRect();

      start.current = {
        x: clientPos.x - rect.left,
        y: clientPos.y - rect.top,
      };

      offset.current = {
        x: clientPos.x,
        y: clientPos.y,
      };

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDrag, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      document.addEventListener('touchcancel', handleDragEnd);

      change({
        left: clientPos.x - rect.left,
        top: clientPos.y - rect.top,
      });

      if (onDragStart) {
        onDragStart(e.nativeEvent);
      }
    }
  }

  const pos = getPosition();
  const valueStyle: {
    width?: string;
    height?: string;
    left?: string;
    top?: string;
  } = {};

  if (axis === 'x') {
    valueStyle.width = pos.left + '%';
  }
  if (axis === 'y') {
    valueStyle.height = pos.top + '%';
  }
  if (xreverse) {
    valueStyle.left = 100 - pos.left + '%';
  }
  if (yreverse) {
    valueStyle.top = 100 - pos.top + '%';
  }

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    left: xreverse ? 100 - pos.left + '%' : pos.left + '%',
    top: yreverse ? 100 - pos.top + '%' : pos.top + '%',
  };

  if (axis === 'x') {
    handleStyle.top = '50%';
  } else if (axis === 'y') {
    handleStyle.left = '50%';
  }

  const styles = {
    track: css(
      defaultStyles[axis].track,
      customStyles != null ? customStyles.track : undefined,
    ),
    active: css(
      defaultStyles[axis].active,
      customStyles != null ? customStyles.active : undefined,
    ),
    thumb: css(
      defaultStyles[axis].thumb,
      customStyles != null ? customStyles.thumb : undefined,
    ),
    disabled: css(
      defaultStyles.disabled,
      customStyles != null ? customStyles.disabled : undefined,
    ),
  };

  return (
    <div
      {...props}
      ref={container}
      className={cx(styles.track, disabled ? styles.disabled : undefined)}
      onTouchStart={handleTrackMouseDown}
      onMouseDown={handleTrackMouseDown}
    >
      <div className={css(styles.active)} style={valueStyle} />
      <div
        ref={handle}
        style={handleStyle}
        onTouchStart={handleMouseDown}
        onMouseDown={handleMouseDown}
        onClick={function (e) {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        <div className={css(styles.thumb)} />
      </div>
    </div>
  );
};

export default Slider;
