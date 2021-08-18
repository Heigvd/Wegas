import { css } from 'emotion';

const DESIGN_SETTINGS = {
  dragUpOrDownColor: '#000',
  dragUpOrDownLineWidth: 4,
  dragOverColor: '#000',
  dragOverBorderWidth: 2,
  selectedColor: 'rgba(100, 100, 100, 0.1)',
};

export const dragUpStyle = css({
  borderTop: `solid ${DESIGN_SETTINGS.dragUpOrDownLineWidth}px ${DESIGN_SETTINGS.dragUpOrDownColor}`,
  marginTop: `-${DESIGN_SETTINGS.dragUpOrDownLineWidth}px`,
});

export const dragDownStyle = css({
  borderBottom: `solid ${DESIGN_SETTINGS.dragUpOrDownLineWidth}px ${DESIGN_SETTINGS.dragUpOrDownColor}`,
  marginBottom: `-${DESIGN_SETTINGS.dragUpOrDownLineWidth}px`,
});

export const dragOverStyle = css({
  border: `solid ${DESIGN_SETTINGS.dragOverBorderWidth}px ${DESIGN_SETTINGS.dragOverColor}`,
  marginTop: `-${DESIGN_SETTINGS.dragOverBorderWidth}px`,
  marginBottom: `-${DESIGN_SETTINGS.dragOverBorderWidth}px`,
});

export const nodeStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  paddingLeft: '5px',
});

export const emptyNodeStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  cursor: 'default',
  paddingLeft: '5px',
  textAlign: 'left',
  color: '#bbb',
});
