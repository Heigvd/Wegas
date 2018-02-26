import * as React from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import { css } from 'glamor';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveReactGridLayout = WidthProvider(Responsive);
const items = css({ backgroundColor: 'lightgray' });
interface GridDemoProps {
  editable: boolean;
}
function GridDemo({ editable = false }: GridDemoProps) {
  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveReactGridLayout
        isResizable={editable}
        isDraggable={editable}
        cols={{ lg: 24, md: 10, sm: 6, xs: 4, xxs: 2 }}
      >
        <div {...items} key="a">
          a
        </div>
        <div {...items} key="b">
          b
        </div>
        <div {...items} key="c">
          c
        </div>
        <div {...items} key="d">
          d
        </div>
        <div {...items} key="e">
          e
        </div>
      </ResponsiveReactGridLayout>
    </div>
  );
}
export default GridDemo;
