import * as React from 'react';
import {useAppSelector} from '../Store/hooks';
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 10000,
  backgroundColor: 'rgba(0,0,0,0.2)',
  width: '100%',
  height: '100%',
};
export default function Overlay(): JSX.Element {

  const overlay = useAppSelector(state => state.global.overlay);

  const style = {
    ...overlayStyle,
    display: overlay > 0 ? 'block' : 'none',
  };

  return (
    <div style={style} />
  );
}